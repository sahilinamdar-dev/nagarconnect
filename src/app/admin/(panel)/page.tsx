import Link from 'next/link';
import { createServerSupabase } from '@/lib/supabase/server';
import { requireMember } from '@/lib/auth';
import { getAdminLang } from '@/lib/adminLang';
import { STATUS_META, issueLabel, tt } from '@/lib/i18n';
import type { Complaint, ComplaintStatus, IssueType } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const [{ tenant }, lang] = await Promise.all([requireMember(), getAdminLang()]);
  const theme = tenant.theme_color || '#0f766e';
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
  const maxIssue = Math.max(1, ...byIssue.values());

  const cards: { label: string; value: number | string; color?: string; icon: string }[] = [
    { label: tt('total', lang), value: total, icon: '📋' },
    { label: STATUS_META.new[lang], value: byStatus('new'), color: STATUS_META.new.color, icon: '🆕' },
    { label: STATUS_META.in_progress[lang], value: byStatus('in_progress'), color: STATUS_META.in_progress.color, icon: '🔧' },
    { label: STATUS_META.resolved[lang], value: byStatus('resolved'), color: STATUS_META.resolved.color, icon: '✅' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">{tt('dashboard', lang)}</h1>
        <Link
          href="/admin/complaints"
          className="rounded-xl px-4 py-2.5 text-white text-sm font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
          style={{ backgroundColor: theme }}
        >
          {tt('viewAll', lang)} →
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow p-5"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{c.label}</p>
              <span className="text-lg">{c.icon}</span>
            </div>
            <p className="mt-2 text-3xl font-bold tabular-nums" style={c.color ? { color: c.color } : { color: '#0f172a' }}>
              {c.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{tt('resolutionRate', lang)}</p>
          <div className="mt-3 flex items-center gap-4">
            <p className="text-3xl font-bold text-slate-900">{resolutionRate}%</p>
            <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${resolutionRate}%`, backgroundColor: theme }}
              />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{tt('avgResolution', lang)}</p>
          <p className="mt-3 text-3xl font-bold text-slate-900">
            {avgHours == null ? '—' : `${avgHours}h`}
          </p>
        </div>
      </div>

      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h2 className="font-semibold text-slate-800 mb-4">{tt('byIssueType', lang)}</h2>
        <div className="space-y-3">
          {[...byIssue.entries()]
            .sort((a, b) => b[1] - a[1])
            .map(([k, v]) => (
              <div key={k} className="flex items-center gap-3">
                <span className="w-44 text-sm text-slate-600 truncate">{issueLabel(k, lang)}</span>
                <div className="flex-1 bg-slate-100 rounded-full h-5 overflow-hidden">
                  <div
                    className="h-full rounded-full flex items-center justify-end pr-2 text-[10px] text-white font-bold transition-all"
                    style={{ width: `${(v / maxIssue) * 100}%`, backgroundColor: theme, minWidth: '1.75rem' }}
                  >
                    {v}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </section>
    </div>
  );
}
