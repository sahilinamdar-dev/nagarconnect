import Link from 'next/link';
import { createServerSupabase } from '@/lib/supabase/server';
import { requireMember } from '@/lib/auth';
import { STATUS_META, issueLabel, ISSUE_TYPES } from '@/lib/i18n';
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
  vastis: { name_marathi: string } | null;
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
      'id, ticket_code, issue_type, status, landmark, citizen_name, citizen_phone, photo_url, created_at, vastis(name_marathi), assigned:team_members!complaints_assigned_to_fkey(name)'
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">तक्रारी · Complaints ({rows.length})</h1>
      </div>

      {/* Filters */}
      <form className="bg-white rounded-xl shadow p-3 flex flex-wrap gap-2 items-end text-sm">
        <Select name="status" label="स्थिती" value={sp.status}>
          <option value="">सर्व</option>
          {(Object.keys(STATUS_META) as ComplaintStatus[]).map((s) => (
            <option key={s} value={s}>{STATUS_META[s].mr}</option>
          ))}
        </Select>
        <Select name="issue" label="प्रकार" value={sp.issue}>
          <option value="">सर्व</option>
          {ISSUE_TYPES.map((i) => (
            <option key={i.value} value={i.value}>{i.mr}</option>
          ))}
        </Select>
        <Select name="vasti" label="वस्ती" value={sp.vasti}>
          <option value="">सर्व</option>
          {(vastis ?? []).map((v) => (
            <option key={v.id} value={v.id}>{v.name_marathi}</option>
          ))}
        </Select>
        <label className="flex flex-col">
          <span className="text-xs text-gray-500">पासून</span>
          <input type="date" name="from" defaultValue={sp.from} className="border rounded-lg px-2 py-1" />
        </label>
        <label className="flex flex-col">
          <span className="text-xs text-gray-500">पर्यंत</span>
          <input type="date" name="to" defaultValue={sp.to} className="border rounded-lg px-2 py-1" />
        </label>
        <button className="rounded-lg bg-teal-700 text-white px-4 py-2">फिल्टर</button>
        <Link href="/admin/complaints" className="px-3 py-2 underline">रीसेट</Link>
      </form>

      {/* List */}
      <div className="bg-white rounded-xl shadow divide-y">
        {rows.length === 0 && <p className="p-4 text-gray-500">तक्रारी नाहीत · No complaints.</p>}
        {rows.map((r) => {
          const meta = STATUS_META[r.status];
          return (
            <Link
              key={r.id}
              href={`/admin/complaints/${r.id}`}
              className="flex gap-3 p-3 hover:bg-gray-50"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {r.photo_url ? (
                <img src={r.photo_url} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-gray-100 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold">{r.ticket_code}</span>
                  <span
                    className="px-2 py-0.5 rounded-full text-white text-xs"
                    style={{ backgroundColor: meta.color }}
                  >
                    {meta.mr}
                  </span>
                  <span className="text-xs text-gray-400 ml-auto">{ageLabel(r.created_at)}</span>
                </div>
                <p className="text-sm">{issueLabel(r.issue_type, 'mr')} · {r.vastis?.name_marathi ?? '—'}</p>
                <p className="text-xs text-gray-500 truncate">{r.landmark}</p>
                <p className="text-xs text-gray-400">
                  {r.citizen_name} · {r.citizen_phone}
                  {r.assigned && ` · ${r.assigned.name}`}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function Select({
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
    <label className="flex flex-col">
      <span className="text-xs text-gray-500">{label}</span>
      <select name={name} defaultValue={value ?? ''} className="border rounded-lg px-2 py-1 bg-white">
        {children}
      </select>
    </label>
  );
}
