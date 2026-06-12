import { createClient } from '@supabase/supabase-js';

// Service-role client. BYPASSES RLS. Server-only. Use for:
//  - resolving a public slug -> tenant for citizen submissions
//  - public status checks (ticket_code + phone)
//  - super-admin tenant management
//  - seed script
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _admin: ReturnType<typeof createClient<any>> | null = null;

export function createAdminSupabase() {
  if (_admin) return _admin;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _admin = createClient<any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  return _admin;
}
