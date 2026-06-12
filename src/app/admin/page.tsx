import Link from 'next/link';
import { createServerSupabase } from '@/lib/supabase/server';
import { requireMember } from '@/lib/auth';
import { STATUS_META, issueLabel } from '@/lib/i18n';
import type { Complaint, ComplaintStatus, IssueType } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  await requireMember();
  const db = await createServerSupabase();
  const { data } = await db
    .from('complaints')
    .select('status, issue_type, created_at, resolved_at')
    .returns<Pick<Complaint, 'status' | 'issue_type' | 'created_at' | 'resolved_at'>[]>();

  const rows = data ?? [];
  const total = rows.length;
  const byStatus = (s: ComplaintStatus) => rows.filter((r) => r.status === s).length;
  const resolved = rows.filter((r) => r.status === 'resolved' && r.resolved_at);
  const avgHours =
    resolved.length === 0
      ? null
      : Math.round(
          resolved.reduce(
            (acc, r) =>
              acc + (new Date(r.resolved_at!).getTime() - new Date(r.created_at).getTime()) / 3.6e6,
            0
          ) / resolved.length
        );
  const resolutionRate = total ? Math.round((byStatus('resolved') / total) * 100) : 0;

  const byIssue = new Map<IssueType, number>();
  rows.forEach((r) => byIssue.set(r.issue_type, (byIssue.get(r.issue_type) || 0) + 1));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">डॅशबोर्ड · Dashboard</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="एकूण · Total" value={total} />
        <Stat label="नवीन · New" value={byStatus('new')} color={STATUS_META.new.color} />
        <Stat label="सुरू · In Progress" value={byStatus('in_progress')} color={STATUS_META.in_progress.color} />
        <Stat label="सोडवली · Resolved" value={byStatus('resolved')} color={STATUS_META.resolved.color} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Stat label="निराकरण दर · Resolution rate" value={`${resolutionRate}%`} />
        <Stat label="सरासरी वेळ · Avg resolution" value={avgHours == null ? '—' : `${avgHours}h`} />
      </div>

      <section className="bg-white rounded-xl shadow p-4">
        <h2 className="font-semibold mb-3">प्रकारानुसार · By issue type</h2>
        <div className="space-y-2">
          {[...byIssue.entries()].map(([k, v]) => (
            <div key={k} className="flex items-center gap-2">
              <span className="w-40 text-sm">{issueLabel(k, 'mr')}</span>
              <div className="flex-1 bg-gray-100 rounded h-4">
                <div
                  className="h-4 rounded bg-teal-600"
                  style={{ width: `${total ? (v / total) * 100 : 0}%` }}
                />
              </div>
              <span className="w-8 text-right text-sm">{v}</span>
            </div>
          ))}
        </div>
      </section>

      <Link href="/admin/complaints" className="inline-block rounded-xl bg-teal-700 text-white px-5 py-3 font-semibold">
        सर्व तक्रारी पहा · View all complaints
      </Link>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number | string; color?: string }) {
  return (
    <div className="bg-white rounded-xl shadow p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-2xl font-bold" style={color ? { color } : undefined}>{value}</p>
    </div>
  );
}
