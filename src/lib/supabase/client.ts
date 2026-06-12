'use client';

import { createBrowserClient } from '@supabase/ssr';

// Anon browser client. Used for public reads (tenant branding, vasti list) and
// citizen inserts. RLS restricts what anon can do.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
