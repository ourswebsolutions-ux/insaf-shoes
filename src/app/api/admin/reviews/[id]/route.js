import { z } from 'zod';
import { handler, ok, readJson } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';
import { refreshProductRating } from '@/lib/catalog';
import { prisma } from '@/lib/db';
import { AppError } from '@/lib/errors';

async function load(params) {
  const r = await prisma.review.findUnique({ where: { id: Number((await params).id) || 0 }, select: { id: true, product_id: true } });
  if (!r) throw new AppError('Review not found', 404);
  return r;
}

export const PATCH = handler(async (req, { params }) => {
  await requireAdmin('reviews');
  const r = await load(params);
  const { status } = z.object({ status: z.enum(['pending', 'approved', 'rejected']) }).parse(await readJson(req));
  await prisma.review.update({ where: { id: r.id }, data: { status } });
  await refreshProductRating(r.product_id);
  return ok({ message: `Review ${status}.` });
});

export const DELETE = handler(async (_req, { params }) => {
  await requireAdmin('reviews');
  const r = await load(params);
  await prisma.review.delete({ where: { id: r.id } });
  await refreshProductRating(r.product_id);
  return ok({ message: 'Review deleted.' });
});
