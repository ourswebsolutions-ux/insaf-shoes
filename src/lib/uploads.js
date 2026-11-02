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
  const dir = path.join(/*turbopackIgnore: true*/ uploadRoot(), safeFolder);
  await fs.mkdir(dir, { recursive: true });
  const name = `${Date.now().toString(36)}-${crypto.randomBytes(6).toString('hex')}.webp`;

  try {
    await sharp(buf, { limitInputPixels: 50_000_000 })
      .rotate()
      .resize({ width: maxWidth, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(path.join(dir, name));
  } catch {
    throw new AppError('This image could not be processed.');
  }
  return `/uploads/${safeFolder}/${name}`;
}
