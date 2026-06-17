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

  // Single round-trip: tenant + its active vastis via embedded resource,
  // instead of two sequential queries (this page is on the network's
  // critical path for every citizen visit, so latency here matters most).
  const { data: tenant } = await db
    .from('tenants')
    .select('*, vastis(*)')
    .eq('slug', slug)
    .eq('vastis.is_active', true)
    .single<Tenant & { vastis: Vasti[] }>();

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

  const vastis = [...tenant.vastis].sort((a, b) => a.name_marathi.localeCompare(b.name_marathi));

  return (
    <ComplaintForm tenant={tenant} vastis={vastis} />
  );
}
