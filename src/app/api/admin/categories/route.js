import { handler, ok, readJson } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';
import { uniqueSlug } from '@/lib/admin-catalog';
import { prisma } from '@/lib/db';
import { categorySchema } from '@/lib/validation';

export const POST = handler(async (req) => {
  await requireAdmin('catalog');
  const { slug, ...d } = categorySchema.parse(await readJson(req));
  const category = await prisma.category.create({
    data: { ...d, description: d.description || null, slug: await uniqueSlug('category', slug || d.name) },
  });
  return ok({ id: category.id, message: 'Category created.' });
});
