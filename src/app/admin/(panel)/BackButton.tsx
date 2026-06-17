'use client';

import { useRouter } from 'next/navigation';

// Uses browser history so returning from a complaint detail lands back on
// the list WITH whatever filters were applied (status/issue/vasti/date),
// instead of a hardcoded Link that always resets to the unfiltered list.
export default function BackButton({ label, fallbackHref }: { label: string; fallbackHref: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.push(fallbackHref);
      }}
      className="rounded-full bg-white border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 shadow-sm"
    >
      ← {label}
    </button>
  );
}
