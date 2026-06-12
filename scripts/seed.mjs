// Seed one demo tenant. Run: node --env-file=.env.local scripts/seed.mjs
// Idempotent-ish: deletes the demo tenant (cascade) then recreates it.
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

const SLUG = 'prabhag-14';
const PREFIX = 'P14';
const PHOTO = (s) => `https://picsum.photos/seed/${s}/800/600`;

async function ensureAuthUser(email, password, fullName) {
  // try to find existing
  const { data: list } = await db.auth.admin.listUsers();
  const found = list?.users?.find((u) => u.email === email);
  if (found) return found.id;
  const { data, error } = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error) throw error;
  return data.user.id;
}

async function main() {
  // wipe existing demo tenant
  await db.from('tenants').delete().eq('slug', SLUG);

  const { data: tenant, error: tErr } = await db
    .from('tenants')
    .insert({
      name: 'Prabhag 14',
      slug: SLUG,
      ward_name: 'प्रभाग १४ · Prabhag 14',
      corporator_name: 'श्री. रमेश पाटील · Shri Ramesh Patil',
      theme_color: '#0f766e',
      gallery_public: true,
      is_active: true,
    })
    .select()
    .single();
  if (tErr) throw tErr;
  const tenantId = tenant.id;

  const vastiRows = [
    { name_marathi: 'इंदिरा नगर', name_english: 'Indira Nagar' },
    { name_marathi: 'गणेश पेठ', name_english: 'Ganesh Peth' },
    { name_marathi: 'शिवाजी वस्ती', name_english: 'Shivaji Vasti' },
    { name_marathi: 'आंबेडकर नगर', name_english: 'Ambedkar Nagar' },
  ].map((v) => ({ ...v, tenant_id: tenantId, is_active: true }));
  const { data: vastis, error: vErr } = await db
    .from('vastis')
    .insert(vastiRows)
    .select();
  if (vErr) throw vErr;

  // team members (with login)
  const adminAuthId = await ensureAuthUser('admin@prabhag14.test', 'password123', 'Office Admin');
  const memberAuthId = await ensureAuthUser('member@prabhag14.test', 'password123', 'Field Member');
  const { data: members, error: mErr } = await db
    .from('team_members')
    .insert([
      { tenant_id: tenantId, auth_user_id: adminAuthId, name: 'सुनील जाधव · Sunil Jadhav', phone: '9000000001', role: 'admin', is_active: true },
      { tenant_id: tenantId, auth_user_id: memberAuthId, name: 'अमोल शिंदे · Amol Shinde', phone: '9000000002', role: 'member', is_active: true },
    ])
    .select();
  if (mErr) throw mErr;
  const memberId = members.find((m) => m.role === 'member').id;

  const issues = ['garbage', 'water_pipeline', 'drainage', 'road_pothole', 'streetlight', 'other'];
  const statuses = ['new', 'new', 'in_progress', 'in_progress', 'resolved', 'resolved', 'resolved', 'rejected', 'new', 'in_progress'];
  const landmarks = [
    'गणपती मंदिरासमोर', 'रेशन दुकानाजवळ', 'शाळेच्या मागे', 'पाण्याच्या टाकीजवळ',
    'बस स्टॉपजवळ', 'मशिदीसमोर', 'दवाखान्याजवळ', 'मैदानाच्या कोपऱ्यात', 'किराणा दुकानाजवळ', 'चौकात',
  ];
  // base coords ~ Pune
  const baseLat = 18.5204, baseLng = 73.8567;

  const complaints = [];
  for (let i = 0; i < 10; i++) {
    const status = statuses[i];
    const created = new Date(Date.now() - (i + 1) * 36 * 3600 * 1000);
    const resolved = status === 'resolved' ? new Date(created.getTime() + 30 * 3600 * 1000) : null;
    const code = `${PREFIX}-2026-${String(i + 1).padStart(4, '0')}`;
    complaints.push({
      tenant_id: tenantId,
      ticket_code: code,
      issue_type: issues[i % issues.length],
      description: i % 3 === 0 ? 'कृपया लवकर लक्ष द्या.' : null,
      photo_url: PHOTO(`before${i}`),
      photo_public_id: null,
      after_photo_url: status === 'resolved' ? PHOTO(`after${i}`) : null,
      gps_lat: Math.random() > 0.3 ? baseLat + (Math.random() - 0.5) * 0.02 : null,
      gps_lng: Math.random() > 0.3 ? baseLng + (Math.random() - 0.5) * 0.02 : null,
      gps_accuracy_m: 25,
      vasti_id: vastis[i % vastis.length].id,
      landmark: landmarks[i],
      galli_detail: i % 2 === 0 ? `गल्ली ${i + 1}` : null,
      citizen_name: `नागरिक ${i + 1}`,
      citizen_phone: `98765${String(43210 + i)}`,
      status,
      assigned_to: status === 'new' ? null : memberId,
      resolved_at: resolved ? resolved.toISOString() : null,
      created_at: created.toISOString(),
    });
  }
  const { data: insertedComplaints, error: cErr } = await db
    .from('complaints')
    .insert(complaints)
    .select();
  if (cErr) throw cErr;

  // created events
  const events = insertedComplaints.map((c) => ({
    complaint_id: c.id,
    actor_id: null,
    event_type: 'created',
    detail: 'तक्रार नोंदवली',
    created_at: c.created_at,
  }));
  await db.from('complaint_events').insert(events);

  console.log('✅ Seed complete');
  console.log(`   Tenant: ${tenant.name} (/w/${SLUG})`);
  console.log(`   Admin login : admin@prabhag14.test / password123`);
  console.log(`   Member login: member@prabhag14.test / password123`);
  console.log(`   Vastis: ${vastis.length}  Complaints: ${insertedComplaints.length}`);
}

main().catch((e) => {
  console.error('Seed failed:', e);
  process.exit(1);
});
