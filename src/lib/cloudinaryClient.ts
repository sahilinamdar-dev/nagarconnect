'use client';

import imageCompression from 'browser-image-compression';

const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;

export interface UploadResult {
  url: string; // secure_url
  publicId: string;
}

// Compress to ~500 KB before upload — cheap Android phones, slow networks.
export async function compressImage(file: File): Promise<File> {
  return imageCompression(file, {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 1600,
    useWebWorker: true,
    initialQuality: 0.8,
  });
}

// Unsigned upload to Cloudinary. folder keeps a tenant's assets grouped.
// Retries once on flaky network.
export async function uploadToCloudinary(
  file: File,
  folder: string
): Promise<UploadResult> {
  const form = new FormData();
  form.append('file', file);
  form.append('upload_preset', PRESET);
  form.append('folder', folder);

  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`,
        { method: 'POST', body: form }
      );
      if (!res.ok) throw new Error(`upload failed ${res.status}`);
      const json = await res.json();
      return { url: json.secure_url, publicId: json.public_id };
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 1200));
    }
  }
  throw lastErr;
}
