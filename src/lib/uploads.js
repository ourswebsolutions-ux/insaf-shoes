import 'server-only';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { AppError } from './errors';

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export function uploadRoot() {
  return path.resolve(/*turbopackIgnore: true*/ process.cwd(), process.env.UPLOAD_DIR || 'uploads');
}

function sniff(buf) {
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpeg';
  if (buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buf.slice(0, 4).toString() === 'RIFF' && buf.slice(8, 12).toString() === 'WEBP') return 'webp';
  if (buf.slice(0, 3).toString() === 'GIF') return 'gif';
  if (buf.slice(4, 12).toString().startsWith('ftypavif')) return 'avif';
  return null;
}

/**
 * Validates an uploaded image by its bytes (not its name or declared type),
 * re-encodes it to WebP (stripping metadata) and stores it under a random name.
 */
export async function saveImage(file, { folder = 'misc', maxWidth = 1600 } = {}) {
  if (!file || typeof file.arrayBuffer !== 'function') throw new AppError('No file uploaded.');
  if (file.size > MAX_UPLOAD_BYTES) throw new AppError('Image must be 8 MB or smaller.');
  const buf = Buffer.from(await file.arrayBuffer());
  if (!sniff(buf)) throw new AppError('Only JPG, PNG, WebP, GIF or AVIF images are allowed.');

  const safeFolder = folder.replace(/[^a-z0-9-]/gi, '') || 'misc';
  let webp;
  try {
    webp = await sharp(buf, { limitInputPixels: 50_000_000 })
      .rotate()
      .resize({ width: maxWidth, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    throw new AppError('This image could not be processed.');
  }

  const cloud = cloudinaryConfig();
  if (cloud) return uploadToCloudinary(webp, safeFolder, cloud);

  const dir = path.join(/*turbopackIgnore: true*/ uploadRoot(), safeFolder);
  await fs.mkdir(dir, { recursive: true });
  const name = `${Date.now().toString(36)}-${crypto.randomBytes(6).toString('hex')}.webp`;
  await fs.writeFile(path.join(dir, name), webp);
  return `/uploads/${safeFolder}/${name}`;
}

/**
 * Cloudinary is used when CLOUDINARY_URL (cloudinary://<key>:<secret>@<cloud>) or
 * CLOUDINARY_CLOUD_NAME + CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET are set.
 * Otherwise images are stored on local disk.
 */
export function cloudinaryConfig() {
  const env = process.env;
  if (env.CLOUDINARY_URL) {
    try {
      const u = new URL(env.CLOUDINARY_URL);
      if (u.protocol === 'cloudinary:' && u.hostname && u.username && u.password)
        return { cloudName: u.hostname, apiKey: decodeURIComponent(u.username), apiSecret: decodeURIComponent(u.password) };
    } catch {}
  }
  if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET)
    return { cloudName: env.CLOUDINARY_CLOUD_NAME, apiKey: env.CLOUDINARY_API_KEY, apiSecret: env.CLOUDINARY_API_SECRET };
  return null;
}

async function uploadToCloudinary(webp, folder, { cloudName, apiKey, apiSecret }) {
  const params = {
    folder: `${(process.env.CLOUDINARY_FOLDER || 'insaf-shoes').replace(/[^a-z0-9_\/-]/gi, '')}/${folder}`,
    timestamp: Math.floor(Date.now() / 1000).toString(),
  };
  // Signed upload: sha1 of the alphabetically sorted params followed by the API secret.
  const toSign = Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join('&');
  const signature = crypto.createHash('sha1').update(toSign + apiSecret).digest('hex');

  const body = new FormData();
  body.append('file', new Blob([webp], { type: 'image/webp' }), 'upload.webp');
  for (const [k, v] of Object.entries(params)) body.append(k, v);
  body.append('api_key', apiKey);
  body.append('signature', signature);

  let res, data;
  try {
    res = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`, { method: 'POST', body });
    data = await res.json();
  } catch {
    throw new AppError('Could not reach Cloudinary. Please try again.', 502);
  }
  if (!res.ok || !data?.secure_url) {
    console.error('Cloudinary upload failed:', data?.error?.message || res.status);
    throw new AppError('Image upload to Cloudinary failed. Check the Cloudinary settings.', 502);
  }
  return data.secure_url;
}
