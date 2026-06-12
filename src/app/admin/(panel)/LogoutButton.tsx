'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LogoutButton() {
  const router = useRouter();
  async function logout() {
    await createClient().auth.signOut();
    router.refresh();
    router.push('/admin/login');
  }
  return (
    <button onClick={logout} className="underline">
      बाहेर · Logout
    </button>
  );
}
