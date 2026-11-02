import { handler, ok } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';
import { AppError } from '@/lib/errors';
import { saveImage } from '@/lib/uploads';

const FOLDERS = { products: 1600, categories: 1200, banners: 2000, testimonials: 400, settings: 800 };

export const POST = handler(async (req) => {
  await requireAdmin();
  const form = await req.formData().catch(() => null);
  if (!form) throw new AppError('Invalid upload.');
  const folder = FOLDERS[form.get('folder')] ? form.get('folder') : 'products';
  const files = form.getAll('file').slice(0, 12);
  if (!files.length) throw new AppError('No file uploaded.');
  const urls = [];
  for (const f of files) urls.push(await saveImage(f, { folder, maxWidth: FOLDERS[folder] }));
  return ok({ urls });
});
