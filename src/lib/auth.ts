import { redirect } from 'next/navigation';
import { createServerSupabase } from './supabase/server';
import type { TeamMember, Tenant } from './types';

// Loads the logged-in member + their tenant. Redirects to login if absent.
export async function requireMember(): Promise<{ member: TeamMember; tenant: Tenant }> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  const { data: member } = await supabase
    .from('team_members')
    .select('*')
    .eq('auth_user_id', user.id)
    .eq('is_active', true)
    .single<TeamMember>();
  if (!member) redirect('/admin/login');

  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', member.tenant_id)
    .single<Tenant>();
  if (!tenant) redirect('/admin/login');

  return { member, tenant };
}
