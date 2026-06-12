'use server';

import { createAdminSupabase } from '@/lib/supabase/admin';
import { notifier } from '@/lib/notify';
import type { IssueType } from '@/lib/types';

export interface SubmitInput {
  slug: string;
  issueType: IssueType;
  description?: string;
  gpsLat?: number | null;
  gpsLng?: number | null;
  gpsAccuracy?: number | null;
  vastiId: string;
  landmark: string;
  galliDetail?: string;
  citizenName: string;
  citizenPhone: string;
}

export interface SubmitResult {
  ok: boolean;
  ticketCode?: string;
  complaintId?: string;
  error?: string;
}

// Citizen submission, step 1 of 2. Creates the complaint WITHOUT the photo.
// The client uploads to Cloudinary only after this succeeds, then calls
// attachComplaintPhoto — so failed submissions never leave orphan images.
export async function submitComplaint(input: SubmitInput): Promise<SubmitResult> {
  // server-side validation (defence in depth)
  if (!/^\d{10}$/.test(input.citizenPhone)) return { ok: false, error: 'invalid_mobile' };
  if (!input.landmark?.trim()) return { ok: false, error: 'landmark_required' };
  if (!input.vastiId) return { ok: false, error: 'vasti_required' };
  if (!input.citizenName?.trim()) return { ok: false, error: 'name_required' };

  const db = createAdminSupabase();

  const { data: tenant } = await db
    .from('tenants')
    .select('id, slug, is_active')
    .eq('slug', input.slug)
    .single();
  if (!tenant || !tenant.is_active) return { ok: false, error: 'tenant_unavailable' };

  // ticket prefix derived from slug digits, fallback to slug uppercase
  const digits = input.slug.match(/\d+/)?.[0];
  const prefix = digits ? `P${digits}` : input.slug.slice(0, 4).toUpperCase();

  const { data: code, error: codeErr } = await db.rpc('next_ticket_code', {
    p_tenant: tenant.id,
    p_prefix: prefix,
  });
  if (codeErr || !code) return { ok: false, error: 'ticket_gen_failed' };

  const { data: complaint, error: insErr } = await db
    .from('complaints')
    .insert({
      tenant_id: tenant.id,
      ticket_code: code,
      issue_type: input.issueType,
      description: input.description || null,
      gps_lat: input.gpsLat ?? null,
      gps_lng: input.gpsLng ?? null,
      gps_accuracy_m: input.gpsAccuracy ?? null,
      vasti_id: input.vastiId,
      landmark: input.landmark.trim(),
      galli_detail: input.galliDetail?.trim() || null,
      citizen_name: input.citizenName.trim(),
      citizen_phone: input.citizenPhone,
      status: 'new',
    })
    .select('id, ticket_code')
    .single();
  if (insErr || !complaint) return { ok: false, error: 'insert_failed' };

  await db.from('complaint_events').insert({
    complaint_id: complaint.id,
    actor_id: null,
    event_type: 'created',
    detail: 'तक्रार नोंदवली · Complaint registered',
  });

  await notifier().onCreated({
    to: input.citizenPhone,
    ticketCode: complaint.ticket_code,
    citizenName: input.citizenName,
  });

  return { ok: true, ticketCode: complaint.ticket_code, complaintId: complaint.id };
}

// Step 2 of 2: attach the Cloudinary photo after the complaint exists.
// Guarded by citizen phone match + only-if-photo-still-empty so it can't
// be used to overwrite someone else's complaint photo.
export async function attachComplaintPhoto(
  complaintId: string,
  citizenPhone: string,
  photoUrl: string,
  photoPublicId: string
): Promise<{ ok: boolean }> {
  if (!photoUrl || !complaintId) return { ok: false };
  const db = createAdminSupabase();
  const { data, error } = await db
    .from('complaints')
    .update({ photo_url: photoUrl, photo_public_id: photoPublicId || null })
    .eq('id', complaintId)
    .eq('citizen_phone', citizenPhone)
    .is('photo_url', null)
    .select('id')
    .single();
  if (error || !data) return { ok: false };

  await db.from('complaint_events').insert({
    complaint_id: complaintId,
    actor_id: null,
    event_type: 'photo_added',
    detail: 'फोटो जोडला · Photo uploaded',
  });
  return { ok: true };
}
