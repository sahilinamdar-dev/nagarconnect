'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { Tenant, Vasti, IssueType } from '@/lib/types';
import { LANGS, type Lang, tt, ISSUE_TYPES } from '@/lib/i18n';
import { compressImage, uploadToCloudinary } from '@/lib/cloudinaryClient';
import { submitComplaint } from './actions';

export default function ComplaintForm({
  tenant,
  vastis,
}: {
  tenant: Tenant;
  vastis: Vasti[];
}) {
  const [lang, setLang] = useState<Lang>('mr');
  const theme = tenant.theme_color || '#0f766e';

  // form state
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [issueType, setIssueType] = useState<IssueType | ''>('');
  const [vastiId, setVastiId] = useState('');
  const [landmark, setLandmark] = useState('');
  const [galli, setGalli] = useState('');
  const [description, setDescription] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  // geolocation (silent, optional)
  const gps = useRef<{ lat: number; lng: number; acc: number } | null>(null);
  const [gpsOn, setGpsOn] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<{ ticketCode: string } | null>(null);

  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        gps.current = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          acc: pos.coords.accuracy,
        };
        setGpsOn(true);
      },
      () => setGpsOn(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  async function onPickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const compressed = await compressImage(f);
      setFile(compressed);
      setPreview(URL.createObjectURL(compressed));
    } catch {
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  }

  function validate(): string | null {
    if (!file) return 'photo_required';
    if (!issueType) return 'issue_required';
    if (!vastiId) return 'vasti_required';
    if (!landmark.trim()) return 'landmark_required';
    if (!name.trim()) return 'name_required';
    if (!/^\d{10}$/.test(phone)) return 'invalid_mobile';
    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setSubmitting(true);
    try {
      const up = await uploadToCloudinary(file!, `nagarconnect/${tenant.slug}`);
      const res = await submitComplaint({
        slug: tenant.slug,
        issueType: issueType as IssueType,
        description,
        photoUrl: up.url,
        photoPublicId: up.publicId,
        gpsLat: gps.current?.lat ?? null,
        gpsLng: gps.current?.lng ?? null,
        gpsAccuracy: gps.current?.acc ?? null,
        vastiId,
        landmark,
        galliDetail: galli,
        citizenName: name,
        citizenPhone: phone,
      });
      if (!res.ok) {
        setError(res.error || 'submit_failed');
        setSubmitting(false);
        return;
      }
      setDone({ ticketCode: res.ticketCode! });
    } catch {
      setError('network_error');
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <main className="min-h-screen flex items-center justify-center p-5 bg-gray-50">
        <div className="w-full max-w-md bg-white rounded-2xl shadow p-6 text-center">
          <div
            className="mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center text-white text-3xl"
            style={{ backgroundColor: theme }}
          >
            ✓
          </div>
          <h1 className="text-xl font-bold">{tt('successTitle', lang)}</h1>
          <p className="mt-2 text-gray-600 text-sm">{tt('successHint', lang)}</p>
          <div className="mt-4 rounded-xl border-2 border-dashed p-4" style={{ borderColor: theme }}>
            <p className="text-xs text-gray-500">{tt('ticketId', lang)}</p>
            <p className="text-2xl font-mono font-bold tracking-wider" style={{ color: theme }}>
              {done.ticketCode}
            </p>
          </div>
          <Link
            href={`/status?code=${encodeURIComponent(done.ticketCode)}`}
            className="mt-5 inline-block w-full rounded-xl py-3 font-semibold text-white"
            style={{ backgroundColor: theme }}
          >
            {tt('checkStatus', lang)}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-10">
      <header className="px-5 py-4 text-white" style={{ backgroundColor: theme }}>
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-lg font-bold leading-tight">{tenant.ward_name || tenant.name}</h1>
            {tenant.corporator_name && (
              <p className="text-xs opacity-90">{tenant.corporator_name}</p>
            )}
          </div>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as Lang)}
            className="bg-white/20 rounded-lg px-2 py-1 text-sm"
            aria-label="Language"
          >
            {LANGS.map((l) => (
              <option key={l.code} value={l.code} className="text-black">
                {l.label}
              </option>
            ))}
          </select>
        </div>
        <p className="mt-1 font-semibold">{tt('registerComplaint', lang)}</p>
      </header>

      <form onSubmit={onSubmit} className="max-w-md mx-auto p-5 space-y-5">
        {/* Photo */}
        <Field label={`${tt('photo', lang)} *`} hint={tt('photoHint', lang)}>
          <label className="block">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="preview" className="w-full h-52 object-cover rounded-xl" />
            ) : (
              <div className="w-full h-40 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 text-4xl">
                📷
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={onPickPhoto}
              className="hidden"
            />
          </label>
        </Field>

        {/* Issue type */}
        <Field label={`${tt('issueType', lang)} *`}>
          <select
            value={issueType}
            onChange={(e) => setIssueType(e.target.value as IssueType)}
            className="w-full rounded-xl border border-gray-300 px-3 py-3 text-base bg-white"
          >
            <option value="">{tt('selectOne', lang)}</option>
            {ISSUE_TYPES.map((it) => (
              <option key={it.value} value={it.value}>
                {it[lang]}
              </option>
            ))}
          </select>
        </Field>

        {/* GPS indicator */}
        <p className="text-xs text-gray-500">
          {gpsOn ? `📍 ${tt('locationOn', lang)}` : `📍 ${tt('locationOff', lang)}`}
        </p>

        {/* Vasti */}
        <Field label={`${tt('vasti', lang)} *`}>
          <select
            value={vastiId}
            onChange={(e) => setVastiId(e.target.value)}
            className="w-full rounded-xl border border-gray-300 px-3 py-3 text-base bg-white"
          >
            <option value="">{tt('selectOne', lang)}</option>
            {vastis.map((v) => (
              <option key={v.id} value={v.id}>
                {lang === 'en' ? v.name_english : v.name_marathi}
              </option>
            ))}
          </select>
        </Field>

        {/* Landmark */}
        <Field label={`${tt('landmark', lang)} *`}>
          <input
            value={landmark}
            onChange={(e) => setLandmark(e.target.value)}
            placeholder={tt('landmarkPh', lang)}
            className="w-full rounded-xl border border-gray-300 px-3 py-3 text-base"
          />
        </Field>

        {/* Galli */}
        <Field label={tt('galli', lang)}>
          <input
            value={galli}
            onChange={(e) => setGalli(e.target.value)}
            className="w-full rounded-xl border border-gray-300 px-3 py-3 text-base"
          />
        </Field>

        {/* Description */}
        <Field label={tt('description', lang)}>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded-xl border border-gray-300 px-3 py-3 text-base"
          />
        </Field>

        {/* Name */}
        <Field label={`${tt('name', lang)} *`}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-gray-300 px-3 py-3 text-base"
          />
        </Field>

        {/* Mobile */}
        <Field label={`${tt('mobile', lang)} *`}>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            inputMode="numeric"
            placeholder="9876543210"
            className="w-full rounded-xl border border-gray-300 px-3 py-3 text-base tracking-wider"
          />
        </Field>

        {error && (
          <p className="text-red-600 text-sm font-medium">
            {error === 'invalid_mobile' ? tt('invalidMobile', lang) : `⚠ ${tt('required', lang)}: ${error}`}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl py-4 text-white text-lg font-bold disabled:opacity-60"
          style={{ backgroundColor: theme }}
        >
          {submitting ? tt('submitting', lang) : tt('submit', lang)}
        </button>

        <Link href="/status" className="block text-center text-sm underline" style={{ color: theme }}>
          {tt('checkStatus', lang)}
        </Link>
      </form>
    </main>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
      {hint && <p className="text-xs text-gray-400 mb-1">{hint}</p>}
      {children}
    </div>
  );
}
