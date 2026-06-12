import { notFound } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { requireMember } from '@/lib/auth';
import { STATUS_META, issueLabel } from '@/lib/i18n';
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
  const { member, tenant } = await requireMember();
  const db = await createServerSupabase();

  const { data: c } = await db
    .from('complaints')
    .select('*, vastis(name_marathi, name_english)')
    .eq('id', id)
    .single<Complaint & { vastis: { name_marathi: string; name_english: string } | null }>();
  if (!c) notFound();

  const { data: events } = await db
    .from('complaint_events')
    .select('*')
    .eq('complaint_id', id)
    .order('created_at', { ascending: true })
    .returns<ComplaintEvent[]>();

  const { data: members } = await db
    .from('team_members')
    .select('*')
    .eq('is_active', true)
    .returns<TeamMember[]>();

  const meta = STATUS_META[c.status];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <a href="/admin/complaints" className="text-sm underline">← मागे</a>
        <h1 className="font-mono font-bold">{c.ticket_code}</h1>
        <span className="px-2 py-0.5 rounded-full text-white text-xs" style={{ backgroundColor: meta.color }}>
          {meta.mr} · {meta.en}
        </span>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Left: photos + address */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Photo label="आधी · Before" url={c.photo_url} />
            <Photo label="नंतर · After" url={c.after_photo_url} />
          </div>

          <section className="bg-white rounded-xl shadow p-4 space-y-1 text-sm">
            <h2 className="font-semibold mb-2">पत्ता · Address (source of truth)</h2>
            <Row k="प्रकार · Issue" v={issueLabel(c.issue_type as IssueType, 'mr')} />
            <Row k="वस्ती · Vasti" v={c.vastis?.name_marathi ?? '—'} />
            <Row k="खूण · Landmark" v={c.landmark} />
            <Row k="गल्ली · Galli" v={c.galli_detail ?? '—'} />
            <Row k="नागरिक · Citizen" v={`${c.citizen_name} · ${c.citizen_phone}`} />
            {c.description && <Row k="तपशील · Note" v={c.description} />}
          </section>

          {/* GPS map shown beside written address; written address wins on conflict */}
          {c.gps_lat != null && c.gps_lng != null ? (
            <section className="bg-white rounded-xl shadow p-2">
              <p className="text-xs text-gray-500 px-2 pt-1 pb-2">
                📍 GPS (≈{Math.round(c.gps_accuracy_m ?? 0)}m) — सूचक, पत्ता अंतिम · indicative only
              </p>
              <MapPin lat={c.gps_lat} lng={c.gps_lng} />
            </section>
          ) : (
            <p className="text-xs text-gray-400">GPS दिलेले नाही · No GPS provided.</p>
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
          />

          <section className="bg-white rounded-xl shadow p-4">
            <h2 className="font-semibold mb-3 text-sm">घडामोडी · Timeline</h2>
            <ol className="space-y-2 text-sm">
              {(events ?? []).map((e) => (
                <li key={e.id} className="flex gap-2">
                  <span className="text-gray-400 text-xs whitespace-nowrap">
                    {new Date(e.created_at).toLocaleString('en-IN')}
                  </span>
                  <span>
                    <b>{e.event_type}</b> {e.detail && `— ${e.detail}`}
                  </span>
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
    <figure>
      <figcaption className="text-xs text-gray-500 mb-1">{label}</figcaption>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={label} className="w-full h-44 object-cover rounded-lg" />
      ) : (
        <div className="w-full h-44 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300">—</div>
      )}
    </figure>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-gray-500 w-32 flex-shrink-0">{k}</span>
      <span className="font-medium">{v}</span>
    </div>
  );
}
