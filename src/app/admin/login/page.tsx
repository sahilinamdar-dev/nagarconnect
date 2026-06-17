'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setErr('चुकीचा ईमेल किंवा पासवर्ड · Wrong email or password');
      setLoading(false);
      return;
    }
    router.refresh();
    router.push('/admin');
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 p-5">
      <form onSubmit={onSubmit} className="w-full max-w-sm bg-white rounded-2xl shadow p-6 space-y-4">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-teal-700">
          ← मुख्यपृष्ठ · Home
        </Link>
        <h1 className="text-xl font-bold">Nagarsevak Connect</h1>
        <p className="text-sm text-gray-500">कार्यालय लॉगिन · Office login</p>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full rounded-xl border border-gray-300 px-3 py-3"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full rounded-xl border border-gray-300 px-3 py-3"
          required
        />
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl py-3 bg-teal-700 text-white font-semibold disabled:opacity-60"
        >
          {loading ? '...' : 'लॉगिन · Login'}
        </button>
      </form>
    </main>
  );
}
