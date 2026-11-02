// Downloads the demo catalog's photos into public/imgs/ (run once; the files are kept in the repo).
//   node scripts/fetch-images.mjs
// Pexels and Unsplash photos are free for commercial use; sources are written to public/imgs/CREDITS.md.
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { BANNERS, PRODUCTS, imageFolder } from '../prisma/catalog-data.mjs';

const ROOT = path.resolve('public/imgs');
const OWN = path.resolve('public/images');

// Crop boxes (left, top, width, height) for the shop's own photos, trimming shelves and boxes.
const OWN_CROPS = {
  'WhatsApp Image 2026-10-31 at 9.03.51 PM.jpeg': [0, 150, 680, 1150],
  'WhatsApp Image 2026-10-31 at 9.04.11 PM.jpeg': [0, 300, 800, 1050],
  'WhatsApp Image 2026-10-31 at 9.04.30 PM.jpeg': [0, 150, 1600, 750],
  'WhatsApp Image 2026-10-31 at 9.04.54 PM.jpeg': [0, 100, 620, 1260],
  'WhatsApp Image 2026-10-31 at 9.05.17 PM.jpeg': [300, 150, 600, 1200],
  'WhatsApp Image 2026-10-31 at 9.08.35 PM.jpeg': [0, 200, 620, 1250],
  'WhatsApp Image 2026-10-31 at 9.09.09 PM.jpeg': [0, 150, 800, 1300],
  'WhatsApp Image 2026-10-31 at 9.09.19 PM.jpeg': [0, 100, 800, 1350],
  'WhatsApp Image 2026-10-31 at 9.11.17 PM.jpeg': [100, 0, 1500, 620],
};

function sourceUrl(ref, width) {
  const [kind, id] = [ref.slice(0, ref.indexOf(':')), ref.slice(ref.indexOf(':') + 1)];
  if (kind === 'px') return { url: `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${width}`, page: `https://www.pexels.com/photo/${id}/`, license: 'Pexels License' };
  if (kind === 'us') return { url: `https://images.unsplash.com/photo-${id}?w=${width}&q=85&fm=jpg`, page: `https://unsplash.com/photos/${id}`, license: 'Unsplash License' };
  return null;
}

async function save(ref, outFile, width) {
  try {
    await fs.access(outFile);
    return 'exists';
  } catch {}
  await fs.mkdir(path.dirname(outFile), { recursive: true });
  let input;
  if (ref.startsWith('own:')) {
    const file = ref.slice(4);
    const [left, top, w, h] = OWN_CROPS[file];
    input = sharp(path.join(OWN, file)).extract({ left, top, width: w, height: h });
  } else {
    const res = await fetch(sourceUrl(ref, width).url);
    if (!res.ok) throw new Error(`${ref}: HTTP ${res.status}`);
    input = sharp(Buffer.from(await res.arrayBuffer()));
  }
  await input.rotate().resize({ width, height: width, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 84, mozjpeg: true }).toFile(outFile);
  return 'saved';
}

const jobs = [];
for (const p of PRODUCTS) {
  p.photos.forEach((ref, i) => jobs.push({ ref, out: path.join(ROOT, imageFolder(p), `${p.slug}-${i + 1}.jpg`), width: 1200, label: p.name }));
}
for (const b of BANNERS) jobs.push({ ref: b.photo, out: path.join(ROOT, 'banners', `${b.file}.jpg`), width: 1800, label: `Banner: ${b.title} ${b.highlight || ''}` });

let failed = 0;
for (let i = 0; i < jobs.length; i += 8) {
  await Promise.all(
    jobs.slice(i, i + 8).map(async (j) => {
      try {
        await save(j.ref, j.out, j.width);
      } catch (e) {
        failed++;
        console.error('FAILED', j.label, e.message);
      }
    })
  );
}

const lines = ['# Image credits', '', 'Product and banner photos in this folder. Pexels and Unsplash photos are free for commercial use under their licenses (no attribution required); sources are listed for reference.', '', '| File | Source | License |', '| --- | --- | --- |'];
for (const j of jobs) {
  const rel = path.relative(ROOT, j.out);
  const src = sourceUrl(j.ref, 0);
  lines.push(src ? `| ${rel} | ${src.page} | ${src.license} |` : `| ${rel} | Shop's own photo (${j.ref.slice(4)}) | Owned by PunjabShop |`);
}
await fs.writeFile(path.join(ROOT, 'CREDITS.md'), lines.join('\n') + '\n');
console.log(`${jobs.length - failed}/${jobs.length} images ready in public/imgs/`);
if (failed) process.exit(1);
