'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LogoutButton({ label }: { label: string }) {
  const router = useRouter();
  async function logout() {
    await createClient().auth.signOut();
    router.refresh();
    router.push('/admin/login');
  }
  return (
    <button
      onClick={logout}
      className="px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 transition-colors"
    >
      {label}
    </button>
  );
}
