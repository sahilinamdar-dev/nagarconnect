-- ============================================================================
-- Nagarsevak Connect — Postgres / Supabase schema + Row Level Security
-- Multi-tenant civic complaint management. Tenant isolation via RLS.
-- Run in Supabase SQL editor (or `supabase db push`).
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- Tables
-- ----------------------------------------------------------------------------

create table if not exists tenants (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  slug           text not null unique,
  ward_name      text,
  corporator_name text,
  logo_url       text,
  theme_color    text default '#0f766e',
  gallery_public boolean not null default false,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now()
);

create table if not exists vastis (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references tenants(id) on delete cascade,
  name_marathi text not null,
  name_english text not null,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);
create index if not exists idx_vastis_tenant on vastis(tenant_id);

create table if not exists team_members (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references tenants(id) on delete cascade,
  auth_user_id uuid unique references auth.users(id) on delete set null,
  name         text not null,
  phone        text,
  role         text not null default 'member' check (role in ('admin','member')),
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);
create index if not exists idx_team_members_tenant on team_members(tenant_id);
create index if not exists idx_team_members_auth on team_members(auth_user_id);

create table if not exists complaints (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references tenants(id) on delete cascade,
  ticket_code     text not null,
  issue_type      text not null check (issue_type in
                    ('garbage','water_pipeline','drainage','road_pothole','streetlight','other')),
  description     text,
  photo_url       text,            -- Cloudinary secure_url (before)
  photo_public_id text,            -- Cloudinary public_id (before) — for delete
  after_photo_url text,            -- Cloudinary secure_url (after)
  after_photo_public_id text,      -- Cloudinary public_id (after) — for delete
  gps_lat         double precision,
  gps_lng         double precision,
  gps_accuracy_m  double precision,
  vasti_id        uuid references vastis(id) on delete set null,
  landmark        text not null,
  galli_detail    text,
  citizen_name    text not null,
  citizen_phone   text not null,
  status          text not null default 'new'
                    check (status in ('new','in_progress','resolved','rejected')),
  assigned_to     uuid references team_members(id) on delete set null,
  resolved_at     timestamptz,
  created_at      timestamptz not null default now(),
  unique (tenant_id, ticket_code)
);
create index if not exists idx_complaints_tenant on complaints(tenant_id);
create index if not exists idx_complaints_status on complaints(tenant_id, status);
create index if not exists idx_complaints_assigned on complaints(assigned_to);

create table if not exists complaint_events (
  id           uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references complaints(id) on delete cascade,
  actor_id     uuid references team_members(id) on delete set null,
  event_type   text not null check (event_type in
                 ('created','assigned','status_changed','note_added','photo_added')),
  detail       text,
  created_at   timestamptz not null default now()
);
create index if not exists idx_events_complaint on complaint_events(complaint_id);

create table if not exists feedback (
  id           uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references complaints(id) on delete cascade,
  rating       int check (rating between 1 and 5),
  comment      text,
  created_at   timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Helper functions (security definer so they can read team_members under RLS)
-- ----------------------------------------------------------------------------

create or replace function public.current_member()
returns team_members
language sql stable security definer set search_path = public as $$
  select * from team_members
  where auth_user_id = auth.uid() and is_active
  limit 1;
$$;

create or replace function public.current_tenant_id()
returns uuid
language sql stable security definer set search_path = public as $$
  select tenant_id from team_members
  where auth_user_id = auth.uid() and is_active
  limit 1;
$$;

create or replace function public.current_member_id()
returns uuid
language sql stable security definer set search_path = public as $$
  select id from team_members
  where auth_user_id = auth.uid() and is_active
  limit 1;
$$;

create or replace function public.current_member_role()
returns text
language sql stable security definer set search_path = public as $$
  select role from team_members
  where auth_user_id = auth.uid() and is_active
  limit 1;
$$;

-- ----------------------------------------------------------------------------
-- Enable RLS
-- ----------------------------------------------------------------------------

alter table tenants          enable row level security;
alter table vastis           enable row level security;
alter table team_members     enable row level security;
alter table complaints       enable row level security;
alter table complaint_events enable row level security;
alter table feedback         enable row level security;

-- TENANTS -------------------------------------------------------------------
-- Public (anon) may read active tenants for the public complaint form branding.
drop policy if exists tenants_public_read on tenants;
create policy tenants_public_read on tenants
  for select using (is_active = true);

-- Authenticated members can read their own tenant (even if inactive, to show notice).
drop policy if exists tenants_member_read on tenants;
create policy tenants_member_read on tenants
  for select to authenticated using (id = current_tenant_id());

-- Admins update their own tenant branding/settings.
drop policy if exists tenants_admin_update on tenants;
create policy tenants_admin_update on tenants
  for update to authenticated
  using (id = current_tenant_id() and current_member_role() = 'admin')
  with check (id = current_tenant_id() and current_member_role() = 'admin');

-- VASTIS --------------------------------------------------------------------
-- Public read of active vastis (drives the citizen form dropdown).
drop policy if exists vastis_public_read on vastis;
create policy vastis_public_read on vastis
  for select using (is_active = true);

drop policy if exists vastis_member_read on vastis;
create policy vastis_member_read on vastis
  for select to authenticated using (tenant_id = current_tenant_id());

drop policy if exists vastis_admin_write on vastis;
create policy vastis_admin_write on vastis
  for all to authenticated
  using (tenant_id = current_tenant_id() and current_member_role() = 'admin')
  with check (tenant_id = current_tenant_id() and current_member_role() = 'admin');

-- TEAM MEMBERS --------------------------------------------------------------
drop policy if exists members_read on team_members;
create policy members_read on team_members
  for select to authenticated using (tenant_id = current_tenant_id());

drop policy if exists members_admin_write on team_members;
create policy members_admin_write on team_members
  for all to authenticated
  using (tenant_id = current_tenant_id() and current_member_role() = 'admin')
  with check (tenant_id = current_tenant_id() and current_member_role() = 'admin');

-- COMPLAINTS ----------------------------------------------------------------
-- Citizen-facing INSERT via anon key, restricted to insert-only into active tenants.
-- (The server action also validates the slug; this policy is the safety net.)
drop policy if exists complaints_anon_insert on complaints;
create policy complaints_anon_insert on complaints
  for insert to anon
  with check (
    status = 'new'
    and after_photo_url is null
    and assigned_to is null
    and exists (select 1 from tenants t where t.id = tenant_id and t.is_active)
  );

-- Members read complaints in their tenant. Plain members only see assigned ones.
drop policy if exists complaints_member_read on complaints;
create policy complaints_member_read on complaints
  for select to authenticated using (
    tenant_id = current_tenant_id()
    and (current_member_role() = 'admin' or assigned_to = current_member_id())
  );

-- Members update complaints they can see (status, assignment, after-photo).
drop policy if exists complaints_member_update on complaints;
create policy complaints_member_update on complaints
  for update to authenticated
  using (
    tenant_id = current_tenant_id()
    and (current_member_role() = 'admin' or assigned_to = current_member_id())
  )
  with check (tenant_id = current_tenant_id());

-- COMPLAINT EVENTS ----------------------------------------------------------
drop policy if exists events_member_read on complaint_events;
create policy events_member_read on complaint_events
  for select to authenticated using (
    exists (select 1 from complaints c
            where c.id = complaint_id and c.tenant_id = current_tenant_id())
  );

drop policy if exists events_member_insert on complaint_events;
create policy events_member_insert on complaint_events
  for insert to authenticated with check (
    exists (select 1 from complaints c
            where c.id = complaint_id and c.tenant_id = current_tenant_id())
  );

-- FEEDBACK ------------------------------------------------------------------
-- Citizens (anon) submit feedback on resolved complaints.
drop policy if exists feedback_anon_insert on feedback;
create policy feedback_anon_insert on feedback
  for insert to anon with check (
    exists (select 1 from complaints c where c.id = complaint_id and c.status = 'resolved')
  );

drop policy if exists feedback_member_read on feedback;
create policy feedback_member_read on feedback
  for select to authenticated using (
    exists (select 1 from complaints c
            where c.id = complaint_id and c.tenant_id = current_tenant_id())
  );

-- Note: complaint photos are stored in Cloudinary, not Supabase Storage.
--   * Citizen upload: unsigned upload preset from the browser (no secret).
--   * Admin delete:   server-side signed destroy using CLOUDINARY_API_SECRET.
-- complaints stores both the secure_url and the public_id for each image.

-- ----------------------------------------------------------------------------
-- Ticket code generator: P<wardNo>-<year>-<seq>. Seq is per tenant+year.
-- ----------------------------------------------------------------------------
create or replace function public.next_ticket_code(p_tenant uuid, p_prefix text)
returns text
language plpgsql security definer set search_path = public as $$
declare
  yr text := to_char(now(), 'YYYY');
  n  int;
begin
  select count(*) + 1 into n
  from complaints
  where tenant_id = p_tenant and to_char(created_at, 'YYYY') = yr;
  return p_prefix || '-' || yr || '-' || lpad(n::text, 4, '0');
end;
$$;
