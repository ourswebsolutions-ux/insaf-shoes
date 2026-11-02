import { z } from 'zod';
import { handler, ok, readJson } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';
import { saveProduct } from '@/lib/admin-catalog';
import { prisma } from '@/lib/db';
import { AppError } from '@/lib/errors';
import { productSchema } from '@/lib/validation';

async function load(params) {
  const { id } = await params;
  const row = await prisma.product.findUnique({ where: { id: Number(id) || 0 }, select: { id: true } });
  if (!row) throw new AppError('Product not found', 404);
  return row.id;
}

export const PUT = handler(async (req, { params }) => {
  await requireAdmin('catalog');
  const id = await load(params);
  const data = productSchema.parse(await readJson(req));
  await saveProduct(data, id);
  return ok({ id, message: 'Product saved.' });
});

// Quick toggles from the product list.
const patchSchema = z.object({
  status: z.enum(['active', 'inactive']).optional(),
  is_featured: z.boolean().optional(),
  is_best_seller: z.boolean().optional(),
  is_new_arrival: z.boolean().optional(),
});

export const PATCH = handler(async (req, { params }) => {
  await requireAdmin('catalog');
  const id = await load(params);
  const data = patchSchema.parse(await readJson(req));
  if (!Object.keys(data).length) throw new AppError('Nothing to update.');
  await prisma.product.update({ where: { id }, data });
  return ok({ message: 'Updated.' });
});

export const DELETE = handler(async (_req, { params }) => {
  await requireAdmin('catalog');
  const id = await load(params);
  await prisma.product.delete({ where: { id } });
  return ok({ message: 'Product deleted.' });
});
