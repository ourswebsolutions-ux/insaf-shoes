import { z } from 'zod';
import { handler, ok, readJson } from '@/lib/api';
import { getCustomer } from '@/lib/auth';
import { evaluateCoupon, findCart, getCartLines, priceCart } from '@/lib/cart';
import { prisma } from '@/lib/db';
import { AppError } from '@/lib/errors';

export const POST = handler(async (req) => {
  const { code } = z.object({ code: z.string().trim().min(1, 'Enter a coupon code').max(40) }).parse(await readJson(req));
  const customer = await getCustomer();
  const cart = await findCart(customer);
  if (!cart) throw new AppError('Add items to your cart first.');
  const lines = await getCartLines(cart.id);
  const subtotal = lines.reduce((s, l) => s + l.line_total, 0);
  const { coupon } = await evaluateCoupon(code, subtotal, { customerId: customer?.id });
  const updated = await prisma.cart.update({ where: { id: cart.id }, data: { coupon_code: coupon.code } });
  return ok(await priceCart(updated, { identity: { customerId: customer?.id } }));
});

export const DELETE = handler(async () => {
  const customer = await getCustomer();
  const cart = await findCart(customer);
  if (!cart) return ok({ lines: [], count: 0 });
  const updated = await prisma.cart.update({ where: { id: cart.id }, data: { coupon_code: null } });
  return ok(await priceCart(updated, { identity: { customerId: customer?.id } }));
});
