'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ComplaintStatus, TeamMember } from '@/lib/types';
import { STATUS_META, tt, type Lang } from '@/lib/i18n';
import { compressImage, uploadToCloudinary } from '@/lib/cloudinaryClient';
import { assignComplaint, changeStatus, addNote, deletePhoto } from '../actions';

export default function ActionPanel({
  complaintId,
  status,
  assignedTo,
  members,
  canDelete,
  tenantSlug,
  hasBefore,
  hasAfter,
  lang,
}: {
  complaintId: string;
  status: ComplaintStatus;
  assignedTo: string | null;
  members: TeamMember[];
  canDelete: boolean;
  tenantSlug: string;
  hasBefore: boolean;
  hasAfter: boolean;
  lang: Lang;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [note, setNote] = useState('');
  const [afterFile, setAfterFile] = useState<File | null>(null);

  function refresh() {
    setBusy(false);
    router.refresh();
  }

  async function onAssign(memberId: string) {
    setBusy(true);
    await assignComplaint(complaintId, memberId || null);
    refresh();
  }

  async function onStatus(s: ComplaintStatus) {
    setErr('');
    if (s === 'resolved') {
      if (!afterFile) {
        setErr(tt('afterPhotoRequired', lang));
        return;
      }
      setBusy(true);
      try {
        const compressed = await compressImage(afterFile);
        const up = await uploadToCloudinary(compressed, `nagarconnect/${tenantSlug}`);
        const res = await changeStatus(complaintId, 'resolved', { url: up.url, publicId: up.publicId });
        if (!res.ok) { setErr(res.error || 'failed'); setBusy(false); return; }
      } catch { setErr('upload failed — retry'); setBusy(false); return; }
    } else {
      setBusy(true);
      await changeStatus(complaintId, s);
    }
    refresh();
  }

  async function onNote() {
    if (!note.trim()) return;
    setBusy(true);
    await addNote(complaintId, note);
    setNote('');
    refresh();
  }

  async function onDelete(which: 'before' | 'after') {
    if (!confirm(`Delete ${which} photo from Cloudinary? This cannot be undone.`)) return;
    setBusy(true);
    await deletePhoto(complaintId, which);
    refresh();
  }

  return (
    <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-5">
      <h2 className="font-semibold text-slate-800 text-sm">⚡ {tt('actions', lang)}</h2>

      {/* Assign */}
      <label className="block text-sm">
        <span className="text-xs font-medium text-slate-500">{tt('assignTo', lang)}</span>
        <select
          defaultValue={assignedTo ?? ''}
          onChange={(e) => onAssign(e.target.value)}
          disabled={busy}
          className="mt-1.5 w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-white disabled:opacity-50"
        >
          <option value="">— {tt('nobody', lang)} —</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
          ))}
        </select>
      </label>

      {/* Status buttons */}
      <div className="flex flex-wrap gap-2">
        {(['new', 'in_progress', 'rejected'] as ComplaintStatus[]).map((s) => (
          <button
            key={s}
            onClick={() => onStatus(s)}
            disabled={busy || status === s}
            className="px-4 py-2 rounded-xl text-white text-sm font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-40 disabled:shadow-none"
            style={{ backgroundColor: STATUS_META[s].color }}
          >
            {STATUS_META[s][lang]}
          </button>
        ))}
      </div>

      {/* Resolve with after-photo */}
      <div className="rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50/50 p-4 space-y-3">
        <p className="text-sm font-medium text-emerald-900">📸 {tt('afterPhotoRequired', lang)}</p>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => setAfterFile(e.target.files?.[0] ?? null)}
          className="text-sm w-full"
        />
        <button
          onClick={() => onStatus('resolved')}
          disabled={busy}
          className="w-full py-2.5 rounded-xl text-white font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-50"
          style={{ backgroundColor: STATUS_META.resolved.color }}
        >
          {busy ? '...' : `✓ ${tt('markResolved', lang)}`}
        </button>
      </div>

      {err && (
        <p className="text-red-600 text-sm bg-red-50 border border-red-100 rounded-lg px-3 py-2">⚠ {err}</p>
      )}

      {/* Note */}
      <div className="space-y-2">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder={tt('internalNote', lang)}
          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm"
        />
        <button
          onClick={onNote}
          disabled={busy || !note.trim()}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold transition-colors disabled:opacity-40"
        >
          {tt('addNote', lang)}
        </button>
      </div>

      {/* Cloudinary delete (admin only) */}
      {canDelete && (hasBefore || hasAfter) && (
        <div className="flex gap-4 pt-3 border-t border-slate-100">
          {hasBefore && (
            <button onClick={() => onDelete('before')} disabled={busy} className="text-xs text-red-500 hover:text-red-700 underline">
              🗑 Delete before photo
            </button>
          )}
          {hasAfter && (
            <button onClick={() => onDelete('after')} disabled={busy} className="text-xs text-red-500 hover:text-red-700 underline">
              🗑 Delete after photo
            </button>
          )}
        </div>
      )}
    </section>
  );
}
