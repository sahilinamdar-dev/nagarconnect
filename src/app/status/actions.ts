'use server';

import { createAdminSupabase } from '@/lib/supabase/admin';
import { issueLabel } from '@/lib/i18n';
import type { ComplaintStatus, IssueType } from '@/lib/types';

export interface StatusResult {
  ok: boolean;
  error?: string;
  data?: {
    ticketCode: string;
    status: ComplaintStatus;
    issueLabel: string;
    landmark: string;
    createdAt: string;
    resolvedAt: string | null;
    photoUrl: string | null;
    afterPhotoUrl: string | null;
  };
}

// Public status check by ticket code + mobile (citizen identity, no OTP in Phase 1).
export async function checkStatus(code: string, phone: string): Promise<StatusResult> {
  if (!code.trim() || !/^\d{10}$/.test(phone)) return { ok: false, error: 'invalid_input' };

  const db = createAdminSupabase();
  const { data: c } = await db
    .from('complaints')
    .select('ticket_code, status, issue_type, landmark, created_at, resolved_at, photo_url, after_photo_url, citizen_phone')
    .eq('ticket_code', code.trim().toUpperCase())
    .eq('citizen_phone', phone)
    .single();

  if (!c) return { ok: false, error: 'not_found' };

  return {
    ok: true,
    data: {
      ticketCode: c.ticket_code as string,
      status: c.status as ComplaintStatus,
      issueLabel: issueLabel(c.issue_type as IssueType, 'mr'),
      landmark: c.landmark as string,
      createdAt: c.created_at as string,
      resolvedAt: c.resolved_at as string | null,
      photoUrl: c.photo_url as string | null,
      afterPhotoUrl: c.after_photo_url as string | null,
    },
  };
}
