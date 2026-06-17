'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { Tenant, Vasti, IssueType } from '@/lib/types';
import { LANGS, type Lang, tt, ISSUE_TYPES } from '@/lib/i18n';
import { compressImage, uploadToCloudinary } from '@/lib/cloudinaryClient';
import { submitComplaint, attachComplaintPhoto } from './actions';

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
  const fileInputRef = useRef<HTMLInputElement>(null);
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
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
    clearFieldError('photo');
    try {
      const compressed = await compressImage(f);
      setFile(compressed);
      setPreview(URL.createObjectURL(compressed));
    } catch {
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  }

  function validate(): Record<string, string> {
    const req = tt('required', lang);
    const errs: Record<string, string> = {};
    if (!file) errs.photo = req;
    if (!issueType) errs.issueType = req;
    if (!vastiId) errs.vasti = req;
    if (!landmark.trim()) errs.landmark = req;
    if (!name.trim()) errs.name = req;
    if (!/^\d{10}$/.test(phone)) errs.phone = tt('invalidMobile', lang);
    return errs;
  }

  function clearFieldError(key: string) {
    setFieldErrors((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  // Pre-fill the form with sample data for demos/testing (photo included).
  async function fillDemo() {
    setIssueType('road_pothole');
    if (vastis[0]) setVastiId(vastis[0].id);
    setLandmark('गणपती मंदिरासमोर, रेशन दुकानाजवळ');
    setGalli('गल्ली ३');
    setDescription('मोठा खड्डा आहे, पावसाळ्यात पाणी साचते.');
    setName('राहुल पवार');
    setPhone('9876543210');
    setFieldErrors({});
    try {
      const res = await fetch('https://picsum.photos/seed/demo-complaint/800/600');
      const blob = await res.blob();
      const f = new File([blob], 'demo.jpg', { type: 'image/jpeg' });
      setFile(f);
      setPreview(URL.createObjectURL(f));
    } catch {
      // offline — photo must be picked manually
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const errs = validate();
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      document.querySelector('[data-error="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setSubmitting(true);
    try {
      // 1) create the complaint first — no image leaves the phone yet
      const res = await submitComplaint({
        slug: tenant.slug,
        issueType: issueType as IssueType,
        description,
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
      // 2) only after success: upload photo to Cloudinary and attach it
      try {
        const up = await uploadToCloudinary(file!, `nagarconnect/${tenant.slug}`);
        await attachComplaintPhoto(res.complaintId!, phone, up.url, up.publicId);
      } catch {
        // complaint is registered; photo upload failed on flaky network.
        // Office can still act on the written address.
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
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-3 w-full rounded-xl py-3 font-semibold border-2"
            style={{ color: theme, borderColor: theme }}
          >
            + नवीन तक्रार · New complaint
          </button>
          <Link href="/" className="mt-3 block text-center text-sm text-gray-400 hover:text-gray-600">
            ← मुख्यपृष्ठ · Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-10">
      <header className="px-5 py-4 text-white" style={{ backgroundColor: theme }}>
        <Link href="/" className="inline-flex items-center gap-1 text-xs opacity-80 hover:opacity-100 mb-2">
          ← मुख्यपृष्ठ · Home
        </Link>
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
        <button
          type="button"
          onClick={fillDemo}
          className="w-full rounded-xl border-2 border-dashed border-gray-300 py-2 text-sm text-gray-500 hover:bg-gray-100"
        >
          🧪 नमुना डेटा भरा · Fill demo data
        </button>

        {/* Photo */}
        <Field label={`${tt('photo', lang)} *`} hint={tt('photoHint', lang)} error={fieldErrors.photo}>
          <div className="relative">
            {preview ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="preview" className="w-full h-52 object-cover rounded-xl" />
                <div className="absolute bottom-2 right-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-lg bg-black/60 text-white text-xs font-semibold px-3 py-1.5 backdrop-blur"
                  >
                    ✏️ बदला · Change
                  </button>
                  <button
                    type="button"
                    onClick={() => { setFile(null); setPreview(''); }}
                    className="rounded-lg bg-black/60 text-white text-xs font-semibold px-3 py-1.5 backdrop-blur"
                  >
                    ✕
                  </button>
                </div>
              </>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-40 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 text-4xl"
              >
                📷
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={onPickPhoto}
              className="hidden"
            />
          </div>
        </Field>

        {/* Issue type */}
        <Field label={`${tt('issueType', lang)} *`} error={fieldErrors.issueType}>
          <select
            value={issueType}
            onChange={(e) => { setIssueType(e.target.value as IssueType); clearFieldError('issueType'); }}
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
        <Field label={`${tt('vasti', lang)} *`} error={fieldErrors.vasti}>
          <select
            value={vastiId}
            onChange={(e) => { setVastiId(e.target.value); clearFieldError('vasti'); }}
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
        <Field label={`${tt('landmark', lang)} *`} error={fieldErrors.landmark}>
          <input
            value={landmark}
            onChange={(e) => { setLandmark(e.target.value); clearFieldError('landmark'); }}
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
        <Field label={`${tt('name', lang)} *`} error={fieldErrors.name}>
          <input
            value={name}
            onChange={(e) => { setName(e.target.value); clearFieldError('name'); }}
            className="w-full rounded-xl border border-gray-300 px-3 py-3 text-base"
          />
        </Field>

        {/* Mobile */}
        <Field label={`${tt('mobile', lang)} *`} error={fieldErrors.phone}>
          <input
            value={phone}
            onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); clearFieldError('phone'); }}
            inputMode="numeric"
            placeholder="9876543210"
            className="w-full rounded-xl border border-gray-300 px-3 py-3 text-base tracking-wider"
          />
        </Field>

        {error && (
          <p className="text-red-600 text-sm font-medium bg-red-50 border border-red-200 rounded-xl px-3 py-2">
            ⚠ {error === 'network_error'
              ? 'नेटवर्क समस्या — पुन्हा प्रयत्न करा · Network error, please retry'
              : error}
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
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div data-error={error ? 'true' : undefined}>
      <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
      {hint && <p className="text-xs text-gray-400 mb-1">{hint}</p>}
      <div className={error ? 'rounded-xl ring-2 ring-red-400' : ''}>{children}</div>
      {error && <p className="mt-1 text-xs font-semibold text-red-600">⚠ {error}</p>}
    </div>
  );
}
