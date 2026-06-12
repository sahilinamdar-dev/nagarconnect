'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ComplaintStatus, TeamMember } from '@/lib/types';
import { STATUS_META } from '@/lib/i18n';
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
}: {
  complaintId: string;
  status: ComplaintStatus;
  assignedTo: string | null;
  members: TeamMember[];
  canDelete: boolean;
  tenantSlug: string;
  hasBefore: boolean;
  hasAfter: boolean;
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
        setErr('कृपया "नंतर" फोटो जोडा · Add an after-photo to resolve');
        return;
      }
      setBusy(true);
      try {
        const compressed = await compressImage(afterFile);
        const up = await uploadToCloudinary(compressed, `nagarconnect/${tenantSlug}`);
        const res = await changeStatus(complaintId, 'resolved', { url: up.url, publicId: up.publicId });
        if (!res.ok) { setErr(res.error || 'failed'); setBusy(false); return; }
      } catch { setErr('upload_failed'); setBusy(false); return; }
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
    <section className="bg-white rounded-xl shadow p-4 space-y-4">
      <h2 className="font-semibold text-sm">कृती · Actions</h2>

      {/* Assign */}
      <label className="block text-sm">
        <span className="text-gray-500">नेमणूक · Assign to</span>
        <select
          defaultValue={assignedTo ?? ''}
          onChange={(e) => onAssign(e.target.value)}
          disabled={busy}
          className="mt-1 w-full border rounded-lg px-2 py-2 bg-white"
        >
          <option value="">— कोणीही नाही —</option>
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
            className="px-3 py-2 rounded-lg text-white text-sm disabled:opacity-50"
            style={{ backgroundColor: STATUS_META[s].color }}
          >
            {STATUS_META[s].mr}
          </button>
        ))}
      </div>

      {/* Resolve with after-photo */}
      <div className="rounded-lg border border-dashed p-3 space-y-2">
        <p className="text-sm font-medium">सोडवण्यासाठी "नंतर" फोटो आवश्यक · After-photo required to resolve</p>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => setAfterFile(e.target.files?.[0] ?? null)}
          className="text-sm"
        />
        <button
          onClick={() => onStatus('resolved')}
          disabled={busy}
          className="w-full py-2 rounded-lg text-white font-semibold disabled:opacity-50"
          style={{ backgroundColor: STATUS_META.resolved.color }}
        >
          {busy ? '...' : 'सोडवली म्हणून चिन्हांकित करा · Mark Resolved'}
        </button>
      </div>

      {err && <p className="text-red-600 text-sm">{err}</p>}

      {/* Note */}
      <div className="space-y-2">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="अंतर्गत टीप · Internal note"
          className="w-full border rounded-lg px-2 py-2 text-sm"
        />
        <button onClick={onNote} disabled={busy} className="px-3 py-2 rounded-lg bg-gray-800 text-white text-sm disabled:opacity-50">
          टीप जोडा · Add note
        </button>
      </div>

      {/* Cloudinary delete (admin only) */}
      {canDelete && (hasBefore || hasAfter) && (
        <div className="flex gap-2 pt-2 border-t">
          {hasBefore && (
            <button onClick={() => onDelete('before')} disabled={busy} className="text-xs text-red-600 underline">
              Delete before photo
            </button>
          )}
          {hasAfter && (
            <button onClick={() => onDelete('after')} disabled={busy} className="text-xs text-red-600 underline">
              Delete after photo
            </button>
          )}
        </div>
      )}
    </section>
  );
}
