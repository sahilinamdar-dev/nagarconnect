import { cookies } from 'next/headers';
import type { Lang } from './i18n';

// Admin UI language, persisted in a cookie set by the header toggle.
export async function getAdminLang(): Promise<Lang> {
  const c = (await cookies()).get('admin_lang')?.value;
  return c === 'hi' || c === 'en' ? c : 'mr';
}
