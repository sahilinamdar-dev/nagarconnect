import Link from 'next/link';
import Image from 'next/image';
import { createServerSupabase } from '@/lib/supabase/server';
import { requireMember } from '@/lib/auth';
import { getAdminLang } from '@/lib/adminLang';
import { STATUS_META, issueLabel, ISSUE_TYPES, tt, type Lang } from '@/lib/i18n';
import type { ComplaintStatus, IssueType, Vasti } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface Row {
  id: string;
  ticket_code: string;
  issue_type: IssueType;
  status: ComplaintStatus;
  landmark: string;
  citizen_name: string;
  citizen_phone: string;
  photo_url: string | null;
  created_at: string;
  vastis: { name_marathi: string; name_english: string } | null;
  assigned: { name: string } | null;
}

function ageLabel(iso: string) {
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3.6e6);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default async function ComplaintsList({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireMember();
  const adminLang: Lang = await getAdminLang();
  const sp = await searchParams;
  const db = await createServerSupabase();

  const { data: vastis } = await db
    .from('vastis')
    .select('id, name_marathi, name_english')
    .order('name_marathi')
    .returns<Vasti[]>();

  let q = db
    .from('complaints')
    .select(
      'id, ticket_code, issue_type, status, landmark, citizen_name, citizen_phone, photo_url, created_at, vastis(name_marathi, name_english), assigned:team_members!complaints_assigned_to_fkey(name)'
    )
    .order('created_at', { ascending: false });

  if (sp.status) q = q.eq('status', sp.status);
  if (sp.issue) q = q.eq('issue_type', sp.issue);
  if (sp.vasti) q = q.eq('vasti_id', sp.vasti);
  if (sp.from) q = q.gte('created_at', sp.from);
  if (sp.to) q = q.lte('created_at', sp.to);

  const { data } = await q.returns<Row[]>();
  const rows = data ?? [];

  return (
    <div className="space-y-5">
      <nav className="text-sm text-slate-400 flex items-center gap-1.5">
        <Link href="/admin" className="hover:text-teal-700">{tt('dashboard', adminLang)}</Link>
        <span>›</span>
        <span className="text-slate-600 font-medium">{tt('complaints', adminLang)}</span>
      </nav>
      <h1 className="text-2xl font-bold text-slate-800">
        {tt('complaints', adminLang)}{' '}
        <span className="text-base font-medium text-slate-400">({rows.length})</span>
      </h1>

      {/* Filters */}
      <form className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-wrap gap-3 items-end text-sm">
        <Sel name="status" label={tt('status', adminLang)} value={sp.status}>
          <option value="">{tt('all', adminLang)}</option>
          {(Object.keys(STATUS_META) as ComplaintStatus[]).map((s) => (
            <option key={s} value={s}>{STATUS_META[s][adminLang]}</option>
          ))}
        </Sel>
        <Sel name="issue" label={tt('issueType', adminLang)} value={sp.issue}>
          <option value="">{tt('all', adminLang)}</option>
          {ISSUE_TYPES.map((i) => (
            <option key={i.value} value={i.value}>{i[adminLang]}</option>
          ))}
        </Sel>
        <Sel name="vasti" label={tt('vasti', adminLang)} value={sp.vasti}>
          <option value="">{tt('all', adminLang)}</option>
          {(vastis ?? []).map((v) => (
            <option key={v.id} value={v.id}>
              {adminLang === 'en' ? v.name_english : v.name_marathi}
            </option>
          ))}
        </Sel>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-500">{tt('from', adminLang)}</span>
          <input type="date" name="from" defaultValue={sp.from} className="border border-slate-200 rounded-lg px-2.5 py-2 bg-white" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-500">{tt('to', adminLang)}</span>
          <input type="date" name="to" defaultValue={sp.to} className="border border-slate-200 rounded-lg px-2.5 py-2 bg-white" />
        </label>
        <button className="rounded-lg bg-slate-900 hover:bg-slate-700 transition-colors text-white px-5 py-2 font-semibold">
          {tt('filter', adminLang)}
        </button>
        <Link href="/admin/complaints" className="px-3 py-2 text-slate-500 hover:text-slate-800 underline">
          {tt('reset', adminLang)}
        </Link>
      </form>

      {/* Cards */}
      <div className="grid sm:grid-cols-2 gap-3">
        {rows.length === 0 && (
          <p className="col-span-full bg-white rounded-2xl border border-slate-100 p-8 text-center text-slate-400">
            {tt('noComplaints', adminLang)}
          </p>
        )}
        {rows.map((r) => {
          const meta = STATUS_META[r.status];
          return (
            <Link
              key={r.id}
              href={`/admin/complaints/${r.id}`}
              className="group flex gap-3 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all p-3"
            >
              {r.photo_url ? (
                <Image
                  src={r.photo_url}
                  alt=""
                  width={80}
                  height={80}
                  className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-20 h-20 rounded-xl bg-slate-100 flex items-center justify-center text-slate-300 text-2xl flex-shrink-0">
                  📷
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-slate-800">{r.ticket_code}</span>
                  <span
                    className="px-2 py-0.5 rounded-full text-white text-[11px] font-semibold"
                    style={{ backgroundColor: meta.color }}
                  >
                    {meta[adminLang]}
                  </span>
                  <span className="text-xs text-slate-400 ml-auto whitespace-nowrap">⏱ {ageLabel(r.created_at)}</span>
                </div>
                <p className="mt-1 text-sm font-medium text-slate-700 truncate">
                  {issueLabel(r.issue_type, adminLang)} · {(adminLang === 'en' ? r.vastis?.name_english : r.vastis?.name_marathi) ?? '—'}
                </p>
                <p className="text-xs text-slate-500 truncate">📍 {r.landmark}</p>
                <p className="text-xs text-slate-400 truncate">
                  {r.citizen_name} · {r.citizen_phone}
                  {r.assigned && <span className="text-slate-500"> · 👤 {r.assigned.name}</span>}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function Sel({
  name,
  label,
  value,
  children,
}: {
  name: string;
  label: string;
  value?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <select name={name} defaultValue={value ?? ''} className="border border-slate-200 rounded-lg px-2.5 py-2 bg-white">
        {children}
      </select>
    </label>
  );
}
