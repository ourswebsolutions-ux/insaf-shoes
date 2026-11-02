import { z } from 'zod';
import { handler, ok, readJson } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';
import { categoryProductBreakdown } from '@/lib/admin-catalog';
import { prisma } from '@/lib/db';
import { AppError } from '@/lib/errors';

async function load(params) {
  const cat = await prisma.category.findUnique({ where: { id: Number((await params).id) || 0 } });
  if (!cat) throw new AppError('Category not found', 404);
  return cat;
}

// How many products a "delete all products" would affect, for the confirmation dialog.
export const GET = handler(async (_req, { params }) => {
  await requireAdmin('catalog');
  const cat = await load(params);
  const b = await categoryProductBreakdown(cat.id);
  return ok({ total: b.all.length, exclusive: b.exclusive.length, shared: b.shared.length });
});

const schema = z.object({
  // all: delete every product in this category (and its sub-categories)
  // exclusive: delete only products not listed in any other category; the rest just leave this category
  mode: z.enum(['all', 'exclusive']),
  expected: z.coerce.number().int().min(0),
});

// Deletes the products in a category. The category itself is kept.
export const DELETE = handler(async (req, { params }) => {
  await requireAdmin('catalog');
  const cat = await load(params);
  const { mode, expected } = schema.parse(await readJson(req));
  const b = await categoryProductBreakdown(cat.id);
  const toDelete = mode === 'all' ? b.all : b.exclusive;
  // Refuse if products were added or removed since the admin saw the numbers.
  if (toDelete.length !== expected) throw new AppError('The products in this category changed. Please check the numbers and try again.', 409);

  const result = await prisma.$transaction(async (tx) => {
    const deleted = toDelete.length ? (await tx.product.deleteMany({ where: { id: { in: toDelete } } })).count : 0;
    let unlinked = 0;
    if (mode === 'exclusive' && b.shared.length) {
      unlinked = (await tx.productCategory.deleteMany({ where: { product_id: { in: b.shared }, category_id: { in: b.familyIds } } })).count;
    }
    return { deleted, unlinked };
  });
  const msg = `${result.deleted} product${result.deleted === 1 ? '' : 's'} deleted from “${cat.name}”.` +
    (mode === 'exclusive' && b.shared.length ? ` ${b.shared.length} shared product${b.shared.length === 1 ? ' was' : 's were'} kept in ${b.shared.length === 1 ? 'its' : 'their'} other categories.` : '');
  return ok({ ...result, message: msg });
});
