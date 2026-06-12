'use client';

import { useRouter } from 'next/navigation';
import { LANGS, type Lang } from '@/lib/i18n';

// Sets the admin_lang cookie and re-renders server components.
export default function LangToggle({ current }: { current: Lang }) {
  const router = useRouter();
  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    document.cookie = `admin_lang=${e.target.value}; path=/; max-age=31536000`;
    router.refresh();
  }
  return (
    <select
      value={current}
      onChange={onChange}
      className="bg-white/20 rounded-lg px-2 py-1 text-sm"
      aria-label="Language"
    >
      {LANGS.map((l) => (
        <option key={l.code} value={l.code} className="text-black">
          {l.label}
        </option>
      ))}
    </select>
  );
}
