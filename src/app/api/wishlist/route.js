import { z } from 'zod';
import { handler, ok, readJson } from '@/lib/api';
import { requireCustomer } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { AppError } from '@/lib/errors';

export const GET = handler(async () => {
  const customer = await requireCustomer();
  const rows = await prisma.wishlist.findMany({ where: { customer_id: customer.id }, select: { product_id: true } });
  return ok({ ids: rows.map((r) => r.product_id) });
});

const body = z.object({ product_id: z.coerce.number().int().positive() });

export const POST = handler(async (req) => {
  const customer = await requireCustomer();
  const { product_id } = body.parse(await readJson(req));
  if (!(await prisma.product.findUnique({ where: { id: product_id }, select: { id: true } }))) throw new AppError('Product not found', 404);
  const key = { customer_id_product_id: { customer_id: customer.id, product_id } };
  await prisma.wishlist.upsert({ where: key, create: { customer_id: customer.id, product_id }, update: {} });
  return ok({ ok: true });
});

export const DELETE = handler(async (req) => {
  const customer = await requireCustomer();
  const { product_id } = body.parse(await readJson(req));
  await prisma.wishlist.deleteMany({ where: { customer_id: customer.id, product_id } });
  return ok({ ok: true });
});
