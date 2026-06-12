'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabase } from '@/lib/supabase/server';
import { requireMember } from '@/lib/auth';
import { cloudinaryDestroy } from '@/lib/cloudinary';
import { notifier } from '@/lib/notify';
import type { ComplaintStatus } from '@/lib/types';

// All actions run under the authenticated session → RLS enforces tenant + role.

export async function assignComplaint(complaintId: string, memberId: string | null) {
  const { member } = await requireMember();
  const db = await createServerSupabase();
  const { error } = await db
    .from('complaints')
    .update({ assigned_to: memberId, status: memberId ? 'in_progress' : undefined })
    .eq('id', complaintId);
  if (error) return { ok: false, error: error.message };

  await db.from('complaint_events').insert({
    complaint_id: complaintId,
    actor_id: member.id,
    event_type: 'assigned',
    detail: memberId ? 'नेमणूक केली' : 'नेमणूक काढली',
  });
  revalidatePath(`/admin/complaints/${complaintId}`);
  revalidatePath('/admin/complaints');
  return { ok: true };
}

export async function changeStatus(
  complaintId: string,
  status: ComplaintStatus,
  after?: { url: string; publicId: string } | null
) {
  const { member } = await requireMember();
  const db = await createServerSupabase();

  // resolving requires an after-photo
  if (status === 'resolved' && !after?.url) {
    return { ok: false, error: 'after_photo_required' };
  }

  const patch: Record<string, unknown> = { status };
  if (status === 'resolved') {
    patch.resolved_at = new Date().toISOString();
    patch.after_photo_url = after!.url;
    patch.after_photo_public_id = after!.publicId;
  }

  const { data: row, error } = await db
    .from('complaints')
    .update(patch)
    .eq('id', complaintId)
    .select('ticket_code, citizen_phone, citizen_name, after_photo_url')
    .single();
  if (error) return { ok: false, error: error.message };

  await db.from('complaint_events').insert({
    complaint_id: complaintId,
    actor_id: member.id,
    event_type: 'status_changed',
    detail: status,
  });

  if (status === 'resolved') {
    await notifier().onResolved({
      to: row.citizen_phone as string,
      ticketCode: row.ticket_code as string,
      citizenName: row.citizen_name as string,
      afterPhotoUrl: row.after_photo_url as string,
    });
  } else {
    await notifier().onStatusChanged({
      to: row.citizen_phone as string,
      ticketCode: row.ticket_code as string,
      citizenName: row.citizen_name as string,
      status,
    });
  }
  revalidatePath(`/admin/complaints/${complaintId}`);
  revalidatePath('/admin/complaints');
  return { ok: true };
}

export async function addNote(complaintId: string, note: string) {
  const { member } = await requireMember();
  if (!note.trim()) return { ok: false, error: 'empty' };
  const db = await createServerSupabase();
  const { error } = await db.from('complaint_events').insert({
    complaint_id: complaintId,
    actor_id: member.id,
    event_type: 'note_added',
    detail: note.trim(),
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/complaints/${complaintId}`);
  return { ok: true };
}

// Admin deletes a complaint photo directly off Cloudinary (and clears the column).
export async function deletePhoto(complaintId: string, which: 'before' | 'after') {
  const { member } = await requireMember();
  if (member.role !== 'admin') return { ok: false, error: 'forbidden' };
  const db = await createServerSupabase();

  const { data: c } = await db
    .from('complaints')
    .select('photo_public_id, after_photo_public_id')
    .eq('id', complaintId)
    .single();
  if (!c) return { ok: false, error: 'not_found' };

  const publicId = which === 'before' ? c.photo_public_id : c.after_photo_public_id;
  if (publicId) await cloudinaryDestroy(publicId as string);

  const patch =
    which === 'before'
      ? { photo_url: null, photo_public_id: null }
      : { after_photo_url: null, after_photo_public_id: null };
  await db.from('complaints').update(patch).eq('id', complaintId);

  await db.from('complaint_events').insert({
    complaint_id: complaintId,
    actor_id: member.id,
    event_type: 'photo_added',
    detail: `${which} photo deleted`,
  });
  revalidatePath(`/admin/complaints/${complaintId}`);
  return { ok: true };
}
