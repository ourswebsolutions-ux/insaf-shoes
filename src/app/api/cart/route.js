import { z } from 'zod';
import { handler, ok, readJson } from '@/lib/api';
import { getCustomer } from '@/lib/auth';
import { assertPurchasable, ensureCart, findCart, MAX_QTY_PER_LINE, priceCart } from '@/lib/cart';
import { prisma } from '@/lib/db';
import { AppError } from '@/lib/errors';

async function respond(cart, customer) {
  if (!cart) return ok({ lines: [], count: 0, subtotal: 0, discount: 0, shipping: 0, payment_fee: 0, total: 0, coupon_code: null });
  return ok(await priceCart(cart, { identity: { customerId: customer?.id } }));
}

export const GET = handler(async () => {
  const customer = await getCustomer();
  return respond(await findCart(customer), customer);
});

const addSchema = z.object({
  product_id: z.coerce.number().int().positive(),
  variant_id: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().min(1).max(MAX_QTY_PER_LINE).default(1),
});

export const POST = handler(async (req) => {
  const body = addSchema.parse(await readJson(req));
  const customer = await getCustomer();
  const cart = await ensureCart(customer);
  const key = { cart_id_variant_id: { cart_id: cart.id, variant_id: body.variant_id } };
  const existing = await prisma.cartItem.findUnique({ where: key, select: { quantity: true } });
  const quantity = (existing?.quantity || 0) + body.quantity;
  if (quantity > MAX_QTY_PER_LINE) throw new AppError(`You can buy up to ${MAX_QTY_PER_LINE} of this item per order.`);
  await assertPurchasable(body.product_id, body.variant_id, quantity);
  await prisma.cartItem.upsert({
    where: key,
    create: { cart_id: cart.id, product_id: body.product_id, variant_id: body.variant_id, quantity },
    update: { quantity },
  });
  await prisma.cart.update({ where: { id: cart.id }, data: { updated_at: new Date() } });
  return respond(cart, customer);
});

const updateSchema = z.object({
  item_id: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().min(1).max(MAX_QTY_PER_LINE),
});

export const PATCH = handler(async (req) => {
  const body = updateSchema.parse(await readJson(req));
  const customer = await getCustomer();
  const cart = await findCart(customer);
  if (!cart) throw new AppError('Your cart is empty.', 404);
  const item = await prisma.cartItem.findFirst({ where: { id: body.item_id, cart_id: cart.id } });
  if (!item) throw new AppError('Item not found in your cart.', 404);
  await assertPurchasable(item.product_id, item.variant_id, body.quantity);
  await prisma.cartItem.update({ where: { id: item.id }, data: { quantity: body.quantity } });
  return respond(cart, customer);
});

export const DELETE = handler(async (req) => {
  const { item_id } = z.object({ item_id: z.coerce.number().int().positive() }).parse(await readJson(req));
  const customer = await getCustomer();
  const cart = await findCart(customer);
  if (cart) await prisma.cartItem.deleteMany({ where: { id: item_id, cart_id: cart.id } });
  return respond(cart, customer);
});
