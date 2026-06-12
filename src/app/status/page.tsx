'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { checkStatus, type StatusResult } from './actions';
import { STATUS_META } from '@/lib/i18n';

function StatusInner() {
  const sp = useSearchParams();
  const [code, setCode] = useState(sp.get('code') || '');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StatusResult | null>(null);

  async function onCheck(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(await checkStatus(code, phone));
    setLoading(false);
  }

  const d = result?.data;
  const meta = d ? STATUS_META[d.status] : null;

  return (
    <main className="min-h-screen bg-gray-50 p-5">
      <div className="max-w-md mx-auto">
        <h1 className="text-xl font-bold mb-1">स्थिती तपासा · Check status</h1>
        <p className="text-sm text-gray-500 mb-4">तक्रार क्रमांक व मोबाईल टाका · Enter ticket ID and mobile</p>

        <form onSubmit={onCheck} className="bg-white rounded-2xl shadow p-4 space-y-3">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="P14-2026-0042"
            className="w-full rounded-xl border border-gray-300 px-3 py-3 font-mono"
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            inputMode="numeric"
            placeholder="मोबाईल नंबर · Mobile"
            className="w-full rounded-xl border border-gray-300 px-3 py-3"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl py-3 bg-teal-700 text-white font-semibold disabled:opacity-60"
          >
            {loading ? '...' : 'तपासा · Check'}
          </button>
        </form>

        {result && !result.ok && (
          <p className="mt-4 text-red-600 text-sm">
            तक्रार सापडली नाही · Not found. क्रमांक व मोबाईल तपासा.
          </p>
        )}

        {d && meta && (
          <div className="mt-5 bg-white rounded-2xl shadow p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold">{d.ticketCode}</span>
              <span
                className="px-3 py-1 rounded-full text-white text-sm font-semibold"
                style={{ backgroundColor: meta.color }}
              >
                {meta.mr} · {meta.en}
              </span>
            </div>
            <p className="text-sm text-gray-600">{d.issueLabel} — {d.landmark}</p>
            <p className="text-xs text-gray-400">
              नोंद · Filed: {new Date(d.createdAt).toLocaleDateString('en-IN')}
              {d.resolvedAt && ` · सोडवली · Resolved: ${new Date(d.resolvedAt).toLocaleDateString('en-IN')}`}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {d.photoUrl && (
                <figure>
                  <figcaption className="text-xs text-gray-500 mb-1">आधी · Before</figcaption>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={d.photoUrl} alt="before" className="rounded-lg w-full h-32 object-cover" />
                </figure>
              )}
              {d.afterPhotoUrl && (
                <figure>
                  <figcaption className="text-xs text-gray-500 mb-1">नंतर · After</figcaption>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={d.afterPhotoUrl} alt="after" className="rounded-lg w-full h-32 object-cover" />
                </figure>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function StatusPage() {
  return (
    <Suspense fallback={<div className="p-5">...</div>}>
      <StatusInner />
    </Suspense>
  );
}
