import { handler, ok, readJson } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';
import { categoryProductBreakdown, uniqueSlug } from '@/lib/admin-catalog';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { AppError } from '@/lib/errors';
import { categorySchema } from '@/lib/validation';

async function load(params) {
  const cat = await prisma.category.findUnique({ where: { id: Number((await params).id) || 0 } });
  if (!cat) throw new AppError('Category not found', 404);
  return cat;
}

export const PUT = handler(async (req, { params }) => {
  await requireAdmin('catalog');
  const { id } = await load(params);
  const { slug, ...d } = categorySchema.parse(await readJson(req));
  // Prevent cycles: the new parent may not be this category or one of its descendants.
  let cursor = d.parent_id;
  while (cursor) {
    if (cursor === id) throw new AppError('A category cannot be placed inside itself or its own sub-category.');
    cursor = (await prisma.category.findUnique({ where: { id: cursor }, select: { parent_id: true } }))?.parent_id;
  }
  await prisma.category.update({
    where: { id },
    data: { ...d, description: d.description || null, slug: await uniqueSlug('category', slug || d.name, id) },
  });
  return ok({ message: 'Category saved.' });
});

const deleteSchema = z.object({
  // move: put this category's products into another category
  // delete: delete products that are only in this category (shared ones stay in their other categories)
  // keep: products stay in the shop, just without this category
  products: z.enum(['move', 'delete', 'keep']),
  target_id: z.coerce.number().int().positive().optional(),
});

// Move a category up or down among its siblings (display order).
export const PATCH = handler(async (req, { params }) => {
  await requireAdmin('catalog');
  const cat = await load(params);
  const { move } = z.object({ move: z.enum(['up', 'down']) }).parse(await readJson(req));
  const siblings = await prisma.category.findMany({ where: { parent_id: cat.parent_id }, orderBy: [{ sort_order: 'asc' }, { name: 'asc' }], select: { id: true } });
  const i = siblings.findIndex((c) => c.id === cat.id);
  const j = move === 'up' ? i - 1 : i + 1;
  if (j < 0 || j >= siblings.length) return ok({ message: 'Already at the ' + (move === 'up' ? 'top.' : 'bottom.') });
  [siblings[i], siblings[j]] = [siblings[j], siblings[i]];
  await prisma.$transaction(siblings.map((c, k) => prisma.category.update({ where: { id: c.id }, data: { sort_order: k + 1 } })));
  return ok({ message: 'Order updated.' });
});

export const GET = handler(async (_req, { params }) => {
  await requireAdmin('catalog');
  const cat = await load(params);
  const [b, children] = await Promise.all([
    categoryProductBreakdown(cat.id, { directOnly: true }),
    prisma.category.count({ where: { parent_id: cat.id } }),
  ]);
  return ok({ total: b.all.length, exclusive: b.exclusive.length, shared: b.shared.length, subcategories: children });
});

export const DELETE = handler(async (req, { params }) => {
  await requireAdmin('catalog');
  const cat = await load(params);
  const body = await req.json().catch(() => ({ products: 'keep' }));
  const { products, target_id } = deleteSchema.parse(body);
  const b = await categoryProductBreakdown(cat.id, { directOnly: true });

  let target = null;
  if (products === 'move') {
    target = target_id && (await prisma.category.findUnique({ where: { id: target_id } }));
    if (!target || target.id === cat.id) throw new AppError('Choose the category to move the products into.');
  }

  const deleted = await prisma.$transaction(async (tx) => {
    if (target) {
      await tx.productCategory.createMany({
        data: b.all.map((product_id) => ({ product_id, category_id: target.id })),
        skipDuplicates: true,
      });
    }
    const removed = products === 'delete' && b.exclusive.length ? (await tx.product.deleteMany({ where: { id: { in: b.exclusive } } })).count : 0;
    // Sub-categories move up one level; remaining product links are removed with the category.
    await tx.category.updateMany({ where: { parent_id: cat.id }, data: { parent_id: cat.parent_id } });
    await tx.category.delete({ where: { id: cat.id } });
    return removed;
  });

  const msg =
    products === 'move' ? `Category deleted. ${b.all.length} product${b.all.length === 1 ? ' was' : 's were'} moved to “${target.name}”.`
    : products === 'delete' ? `Category deleted along with ${deleted} product${deleted === 1 ? '' : 's'}.`
    : 'Category deleted. Its products are still in the shop.';
  return ok({ message: msg });
});
