import crypto from 'crypto';

// Server-side Cloudinary helpers. Signed destroy needs API secret -> server only.
// Citizen uploads happen client-side via an unsigned preset (see cloudinaryClient.ts).

const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const API_KEY = process.env.CLOUDINARY_API_KEY!;
const API_SECRET = process.env.CLOUDINARY_API_SECRET!;

// Delete an asset by public_id. Used when admin removes a complaint photo.
export async function cloudinaryDestroy(publicId: string): Promise<boolean> {
  const timestamp = Math.floor(Date.now() / 1000);
  // signature = sha1 of sorted params + api_secret
  const toSign = `public_id=${publicId}&timestamp=${timestamp}${API_SECRET}`;
  const signature = crypto.createHash('sha1').update(toSign).digest('hex');

  const body = new URLSearchParams({
    public_id: publicId,
    timestamp: String(timestamp),
    api_key: API_KEY,
    signature,
  });

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD}/image/destroy`,
    { method: 'POST', body }
  );
  const json = await res.json();
  return json.result === 'ok' || json.result === 'not found';
}
