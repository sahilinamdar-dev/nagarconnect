import { notFound } from 'next/navigation';
import { createAdminSupabase } from '@/lib/supabase/admin';
import type { Tenant, Vasti } from '@/lib/types';
import ComplaintForm from './ComplaintForm';

export const dynamic = 'force-dynamic';

export default async function PublicComplaintPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const db = createAdminSupabase();

  const { data: tenant } = await db
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .single<Tenant>();

  if (!tenant) notFound();

  if (!tenant.is_active) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 text-center">
        <p className="text-gray-600">
          ही सेवा सध्या उपलब्ध नाही · This service is currently unavailable.
        </p>
      </main>
    );
  }

  const { data: vastis } = await db
    .from('vastis')
    .select('*')
    .eq('tenant_id', tenant.id)
    .eq('is_active', true)
    .order('name_marathi')
    .returns<Vasti[]>();

  return (
    <ComplaintForm tenant={tenant} vastis={vastis ?? []} />
  );
}
