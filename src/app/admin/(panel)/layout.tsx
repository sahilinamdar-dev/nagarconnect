import Link from 'next/link';
import { requireMember } from '@/lib/auth';
import { getAdminLang } from '@/lib/adminLang';
import { tt } from '@/lib/i18n';
import LogoutButton from './LogoutButton';
import LangToggle from './LangToggle';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [{ member, tenant }, lang] = await Promise.all([requireMember(), getAdminLang()]);
  const theme = tenant.theme_color || '#0f766e';

  return (
    <div className="min-h-screen bg-slate-50">
      <header
        className="sticky top-0 z-40 text-white shadow-lg"
        style={{ background: `linear-gradient(135deg, ${theme}, ${theme}dd)` }}
      >
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-5 min-w-0">
            <Link href="/admin" className="font-bold text-lg tracking-tight truncate">
              {tenant.ward_name || tenant.name}
            </Link>
            <nav className="hidden sm:flex gap-1 text-sm">
              <Link href="/admin" className="px-3 py-1.5 rounded-full hover:bg-white/15 transition-colors">
                {tt('dashboard', lang)}
              </Link>
              <Link href="/admin/complaints" className="px-3 py-1.5 rounded-full hover:bg-white/15 transition-colors">
                {tt('complaints', lang)}
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <LangToggle current={lang} />
            <div className="hidden md:flex items-center gap-2 opacity-90">
              <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold">
                {member.name.charAt(0)}
              </span>
              <span className="max-w-36 truncate">{member.name}</span>
            </div>
            <LogoutButton label={tt('logout', lang)} />
          </div>
        </div>
        {/* mobile nav */}
        <nav className="sm:hidden flex gap-1 px-4 pb-2 text-sm">
          <Link href="/admin" className="px-3 py-1.5 rounded-full bg-white/10">{tt('dashboard', lang)}</Link>
          <Link href="/admin/complaints" className="px-3 py-1.5 rounded-full bg-white/10">{tt('complaints', lang)}</Link>
        </nav>
      </header>
      <main className="p-4 sm:p-6 max-w-6xl mx-auto">{children}</main>
    </div>
  );
}
