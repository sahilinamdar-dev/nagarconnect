import Link from 'next/link';
import { requireMember } from '@/lib/auth';
import LogoutButton from './LogoutButton';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { member, tenant } = await requireMember();
  const theme = tenant.theme_color || '#0f766e';

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="text-white px-4 py-3 flex items-center justify-between" style={{ backgroundColor: theme }}>
        <div className="flex items-center gap-4">
          <Link href="/admin" className="font-bold">{tenant.ward_name || tenant.name}</Link>
          <nav className="hidden sm:flex gap-4 text-sm opacity-90">
            <Link href="/admin">डॅशबोर्ड</Link>
            <Link href="/admin/complaints">तक्रारी</Link>
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="opacity-90">{member.name} · {member.role}</span>
          <LogoutButton />
        </div>
      </header>
      <main className="p-4 max-w-6xl mx-auto">{children}</main>
    </div>
  );
}
