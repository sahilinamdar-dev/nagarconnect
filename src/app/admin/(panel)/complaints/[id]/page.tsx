import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { requireMember } from '@/lib/auth';
import { getAdminLang } from '@/lib/adminLang';
import { STATUS_META, issueLabel, tt } from '@/lib/i18n';
import type { Complaint, ComplaintEvent, IssueType, TeamMember } from '@/lib/types';
import ActionPanel from './ActionPanel';
import MapPin from './MapPin';

export const dynamic = 'force-dynamic';

export default async function ComplaintDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [{ member, tenant }, lang] = await Promise.all([requireMember(), getAdminLang()]);
  const db = await createServerSupabase();

  const { data: c } = await db
    .from('complaints')
    .select('*, vastis(name_marathi, name_english)')
    .eq('id', id)
    .single<Complaint & { vastis: { name_marathi: string; name_english: string } | null }>();
  if (!c) notFound();

  const [{ data: events }, { data: members }] = await Promise.all([
    db
      .from('complaint_events')
      .select('*')
      .eq('complaint_id', id)
      .order('created_at', { ascending: true })
      .returns<ComplaintEvent[]>(),
    db.from('team_members').select('*').eq('is_active', true).returns<TeamMember[]>(),
  ]);

  const meta = STATUS_META[c.status];
  const vastiName = (lang === 'en' ? c.vastis?.name_english : c.vastis?.name_marathi) ?? '—';

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <Link
          href="/admin/complaints"
          className="rounded-full bg-white border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 shadow-sm"
        >
          ← {tt('back', lang)}
        </Link>
        <h1 className="font-mono font-bold text-lg text-slate-800">{c.ticket_code}</h1>
        <span
          className="px-3 py-1 rounded-full text-white text-xs font-semibold shadow-sm"
          style={{ backgroundColor: meta.color }}
        >
          {meta[lang]}
        </span>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Left: photos + address */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Photo label={tt('before', lang)} url={c.photo_url} />
            <Photo label={tt('after', lang)} url={c.after_photo_url} />
          </div>

          <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-2.5 text-sm">
            <h2 className="font-semibold text-slate-800">📍 {tt('address', lang)}</h2>
            <Row k={tt('issueType', lang)} v={issueLabel(c.issue_type as IssueType, lang)} />
            <Row k={tt('vasti', lang)} v={vastiName} />
            <Row k={tt('landmark', lang)} v={c.landmark} />
            <Row k={tt('galli', lang).split('(')[0]} v={c.galli_detail ?? '—'} />
            <Row k={tt('citizen', lang)} v={`${c.citizen_name} · ${c.citizen_phone}`} />
            {c.description && <Row k={tt('description', lang).split('(')[0]} v={c.description} />}
          </section>

          {c.gps_lat != null && c.gps_lng != null ? (
            <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-2 overflow-hidden">
              <p className="text-xs text-slate-500 px-2 pt-1 pb-2">
                🛰 GPS ≈{Math.round(c.gps_accuracy_m ?? 0)}m — indicative; written address is final
              </p>
              <MapPin lat={c.gps_lat} lng={c.gps_lng} />
            </section>
          ) : (
            <p className="text-xs text-slate-400 px-1">— GPS not provided —</p>
          )}
        </div>

        {/* Right: actions + timeline */}
        <div className="space-y-4">
          <ActionPanel
            complaintId={c.id}
            status={c.status}
            assignedTo={c.assigned_to}
            members={members ?? []}
            canDelete={member.role === 'admin'}
            tenantSlug={tenant.slug}
            hasBefore={!!c.photo_url}
            hasAfter={!!c.after_photo_url}
            lang={lang}
          />

          <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h2 className="font-semibold text-slate-800 mb-4 text-sm">🕐 {tt('timeline', lang)}</h2>
            <ol className="relative border-l-2 border-slate-100 ml-2 space-y-4">
              {(events ?? []).map((e) => (
                <li key={e.id} className="ml-4">
                  <span className="absolute -left-[5px] mt-1.5 w-2 h-2 rounded-full bg-slate-300" />
                  <p className="text-xs text-slate-400">
                    {new Date(e.created_at).toLocaleString('en-IN')}
                  </p>
                  <p className="text-sm text-slate-700">
                    <b>{e.event_type.replace('_', ' ')}</b>
                    {e.detail && <span className="text-slate-500"> — {e.detail}</span>}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}

function Photo({ label, url }: { label: string; url: string | null }) {
  return (
    <figure className="bg-white rounded-2xl border border-slate-100 shadow-sm p-2">
      <figcaption className="text-xs font-medium text-slate-500 mb-1.5 px-1">{label}</figcaption>
      {url ? (
        <a href={url} target="_blank" rel="noreferrer">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={label} className="w-full h-44 object-cover rounded-xl hover:opacity-90 transition-opacity" />
        </a>
      ) : (
        <div className="w-full h-44 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 text-3xl">
          📷
        </div>
      )}
    </figure>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-slate-500 w-32 flex-shrink-0">{k}</span>
      <span className="font-medium text-slate-800">{v}</span>
    </div>
  );
}
