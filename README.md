# Nagarsevak Connect

Multi-tenant civic complaint management SaaS for municipal corporators (nagarsevaks).
Citizens report ward issues (garbage, pipeline leaks, drainage, potholes, streetlights)
via a mobile-first form with a photo; the corporator's office tracks and resolves them.

- **Frontend/Backend:** Next.js 16 (App Router), Tailwind CSS, Server Actions
- **DB + Auth:** Supabase (Postgres + Row Level Security + Supabase Auth)
- **Image storage:** Cloudinary (admin can view, download, and delete images)
- **Maps:** Leaflet + OpenStreetMap
- **Notifications:** pluggable module (Phase 1 = console; Phase 2 = WhatsApp Cloud API)

## Tenant model

One codebase, many corporator tenants. Each tenant has a public form URL
`/w/<slug>` (e.g. `/w/prabhag-14`) and a private admin panel at `/admin`.
RLS isolates every tenant's data by `tenant_id`.

| Role | Access |
|------|--------|
| Citizen | No login. Submits at `/w/<slug>`, checks status at `/status`. |
| Team member | Logs in, sees complaints assigned to them, resolves with after-photo. |
| Client admin | Sees all ward complaints, assigns, manages vastis/team, analytics. |
| Super admin | Service role — manages tenants, enable/disable for billing. |

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. SQL editor → paste & run [`supabase/schema.sql`](supabase/schema.sql)
   (tables, RLS policies, helper functions, ticket-code generator).
3. Project settings → API → copy **Project URL**, **anon key**, **service_role key**.

### 2. Cloudinary

1. Create a free account at [cloudinary.com](https://cloudinary.com).
2. Settings → Upload → add an **unsigned** upload preset
   (name it `nagarconnect_unsigned`). Lets citizens upload without a secret.
3. Copy **cloud name**, **API key**, **API secret** from the dashboard.

### 3. Env

```bash
cp .env.local.example .env.local
# fill in Supabase + Cloudinary values
```

### 4. Install, seed, run

```bash
npm install
node --env-file=.env.local scripts/seed.mjs   # demo tenant "Prabhag 14"
npm run dev
```

Seed creates:
- Tenant **Prabhag 14** (`/w/prabhag-14`), 4 vastis, 2 team members, 10 complaints.
- Logins: `admin@prabhag14.test` / `password123` (admin),
  `member@prabhag14.test` / `password123` (member).

## End-to-end flow (Phase 1)

1. Citizen opens `/w/prabhag-14`, picks photo (auto-compressed to ~500 KB,
   uploaded to Cloudinary), fills issue/vasti/landmark/name/mobile, submits.
   GPS is captured silently if allowed but address fields are the source of truth.
2. Gets a ticket like `P14-2026-0042` + status link.
3. Admin logs in at `/admin`, sees the complaint, assigns to a team member.
4. Member resolves it, uploads an **after** photo (required to resolve).
5. Citizen checks `/status` with ticket + mobile → sees before/after.

## Image storage (Cloudinary)

- **Upload:** browser-side unsigned upload (`src/lib/cloudinaryClient.ts`). No secret exposed.
- **Delete:** admin-only, server-side signed destroy (`src/lib/cloudinary.ts` →
  delete buttons on `/admin/complaints/[id]`).
- **Download:** images are public `secure_url`s — open/save directly.
- `complaints` stores both `*_url` and `*_public_id` per image so deletes work.

## Deploy (Vercel)

1. Push to GitHub, import into Vercel.
2. Add the same env vars. Keep `SUPABASE_SERVICE_ROLE_KEY`, `CLOUDINARY_API_KEY`,
   `CLOUDINARY_API_SECRET` server-only (no `NEXT_PUBLIC_` prefix).
3. Set `NEXT_PUBLIC_APP_URL` to the deployed URL.

## Project structure

```
src/lib/
  supabase/{client,server,admin}.ts   anon / session / service-role clients
  cloudinary.ts / cloudinaryClient.ts server delete / client compress+upload
  i18n.ts          mr/hi/en strings, issue types, status meta
  notify/index.ts  pluggable notification provider (Phase 2 = WhatsApp)
  auth.ts          requireMember() — loads member + tenant, gates admin
src/app/
  w/[slug]/        public complaint form + submit action
  status/          public status check
  admin/           login, dashboard, complaints list + detail, actions
  middleware.ts    session refresh + /admin guard
supabase/schema.sql
scripts/seed.mjs
```

## Phase 2 (designed for, not built)

- WhatsApp Cloud API notifications — implement `NotificationProvider` in
  `src/lib/notify`, swap the factory. Call sites already fire `onCreated`/`onResolved`.
- Voice-note complaints, duplicate detection, citizen OTP, subscription billing.
- Admin map view (clustered pins), monthly PDF/CSV export, vasti/team settings UI,
  public before/after gallery (`tenants.gallery_public` flag already exists).
```
