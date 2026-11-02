import { z } from 'zod';
import { handler, ok, readJson } from '@/lib/api';
import { requireCustomer } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { AppError } from '@/lib/errors';
import { reviewSchema } from '@/lib/validation';

export const POST = handler(async (req) => {
  const customer = await requireCustomer();
  const body = await readJson(req);
  const { product_id } = z.object({ product_id: z.coerce.number().int().positive() }).parse(body);
  const data = reviewSchema.parse(body);

  const product = await prisma.product.findFirst({ where: { id: product_id, status: 'active' }, select: { id: true } });
  if (!product) throw new AppError('Product not found', 404);
  if (await prisma.review.findFirst({ where: { product_id, customer_id: customer.id }, select: { id: true } }))
    throw new AppError('You have already reviewed this product.', 409);

  const purchased = await prisma.orderItem.findFirst({
    where: { product_id, order: { customer_id: customer.id, status: 'delivered' } },
    select: { id: true },
  });
  await prisma.review.create({
    data: {
      product_id,
      customer_id: customer.id,
      name: customer.name,
      rating: data.rating,
      title: data.title,
      comment: data.comment,
      is_verified_purchase: !!purchased,
      status: 'pending',
    },
  });
  return ok({ message: 'Thank you! Your review has been submitted and will appear after moderation.' });
});
