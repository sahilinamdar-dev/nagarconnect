import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createServerSupabase } from './supabase/server';
import type { TeamMember, Tenant } from './types';

// Loads the logged-in member + their tenant. Redirects to login if absent.
// cache() dedupes this across layout + page in the same request.
//
// Uses getSession() (reads the cookie, no network call) instead of
// getUser() (always round-trips to Supabase Auth) — safe here because
// proxy.ts middleware already called getUser() to verify the session
// for every /admin/* request before this ever runs. Combined with
// embedding tenants in the team_members select, this cuts page load
// from 4 sequential round-trips (middleware getUser + getUser + member
// + tenant) down to 1 (middleware getUser only).
export const requireMember = cache(async (): Promise<{ member: TeamMember; tenant: Tenant }> => {
  const supabase = await createServerSupabase();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) redirect('/admin/login');

  const { data: member } = await supabase
    .from('team_members')
    .select('*, tenant:tenants(*)')
    .eq('auth_user_id', session.user.id)
    .eq('is_active', true)
    .single<TeamMember & { tenant: Tenant }>();
  if (!member) redirect('/admin/login');

  return { member, tenant: member.tenant };
});
