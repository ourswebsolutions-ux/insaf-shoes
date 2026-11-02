import 'server-only';
import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { prisma } from './db';
import { AppError } from './errors';
import { effectivePrice } from './format';
import { getSettings, shippingFeeFor } from './settings';

export const CART_COOKIE = 'ps_cart';
export const MAX_QTY_PER_LINE = 10;

async function cartByToken(token) {
  if (!token || !/^[a-f0-9]{32}$/.test(token)) return null;
  return prisma.cart.findUnique({ where: { token } });
}

/** Finds the active cart for this request without creating one. */
export async function findCart(customer) {
  const token = (await cookies()).get(CART_COOKIE)?.value;
  if (customer) {
    const own = await prisma.cart.findFirst({ where: { customer_id: customer.id }, orderBy: { updated_at: 'desc' } });
    if (own) return own;
  }
  const guest = await cartByToken(token);
  if (guest && (!guest.customer_id || guest.customer_id === customer?.id)) return guest;
  return null;
}

/** Finds or creates the cart (route handlers only, since it may set a cookie). */
export async function ensureCart(customer) {
  const existing = await findCart(customer);
  if (existing) {
    if (customer && !existing.customer_id) {
      return prisma.cart.update({ where: { id: existing.id }, data: { customer_id: customer.id } });
    }
    return existing;
  }
  const cart = await prisma.cart.create({
    data: { token: crypto.randomBytes(16).toString('hex'), customer_id: customer?.id || null },
  });
  (await cookies()).set(CART_COOKIE, cart.token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 60,
  });
  return cart;
}

/** After login: move guest cart lines into the customer's cart. */
export async function mergeGuestCart(customer) {
  const guest = await cartByToken((await cookies()).get(CART_COOKIE)?.value);
  if (!guest || guest.customer_id) return;
  const own = await prisma.cart.findFirst({ where: { customer_id: customer.id }, orderBy: { updated_at: 'desc' } });
  if (!own) {
    await prisma.cart.update({ where: { id: guest.id }, data: { customer_id: customer.id } });
    return;
  }
  const lines = await prisma.cartItem.findMany({ where: { cart_id: guest.id } });
  await prisma.$transaction(async (tx) => {
    for (const l of lines) {
      const mine = await tx.cartItem.findUnique({ where: { cart_id_variant_id: { cart_id: own.id, variant_id: l.variant_id } } });
      if (mine) {
        await tx.cartItem.update({ where: { id: mine.id }, data: { quantity: Math.min(mine.quantity + l.quantity, MAX_QTY_PER_LINE) } });
      } else {
        await tx.cartItem.create({ data: { cart_id: own.id, product_id: l.product_id, variant_id: l.variant_id, quantity: l.quantity } });
      }
    }
    await tx.cart.delete({ where: { id: guest.id } });
  });
}

const LINE_INCLUDE = {
  product: { select: { name: true, slug: true, price: true, sale_price: true, status: true, sku: true, images: { orderBy: [{ sort_order: 'asc' }, { id: 'asc' }], take: 1, select: { url: true } } } },
  variant: { select: { size: true, color: true, color_hex: true, stock: true, price_adjustment: true, status: true, sku: true } },
};

/** Cart lines joined with live product data; flags anything no longer purchasable. */
export async function getCartLines(cartId) {
  const rows = await prisma.cartItem.findMany({ where: { cart_id: cartId }, include: LINE_INCLUDE, orderBy: { id: 'asc' } });
  return rows.map(({ product: p, variant: v, ...ci }) => {
    const adj = Number(v.price_adjustment || 0);
    const unit = effectivePrice(p) + adj;
    let issue = null;
    if (p.status !== 'active' || v.status !== 'active') issue = 'This item is no longer available.';
    else if (v.stock <= 0) issue = 'Out of stock.';
    else if (ci.quantity > v.stock) issue = `Only ${v.stock} left in stock.`;
    return {
      id: ci.id,
      product_id: ci.product_id,
      variant_id: ci.variant_id,
      name: p.name,
      slug: p.slug,
      image: p.images[0]?.url || null,
      size: v.size,
      color: v.color,
      color_hex: v.color_hex,
      sku: v.sku || p.sku,
      stock: v.stock,
      quantity: ci.quantity,
      unit_price: unit,
      regular_price: Number(p.price) + adj,
      line_total: unit * ci.quantity,
      issue,
    };
  });
}

/**
 * Validates a coupon against a subtotal. Returns { coupon, discount } or throws AppError.
 * `identity` is { customerId, phone } for per-customer limits.
 */
export async function evaluateCoupon(code, subtotal, identity = {}, client = prisma) {
  const coupon = await client.coupon.findUnique({ where: { code: String(code || '').trim().toUpperCase() } });
  if (!coupon || coupon.status !== 'active') throw new AppError('This coupon code is not valid.');
  const now = new Date();
  if (coupon.starts_at && coupon.starts_at > now) throw new AppError('This coupon is not active yet.');
  if (coupon.expires_at && coupon.expires_at < now) throw new AppError('This coupon has expired.');
  if (coupon.usage_limit != null && coupon.used_count >= coupon.usage_limit) throw new AppError('This coupon has reached its usage limit.');
  if (subtotal < coupon.min_order)
    throw new AppError(`Add items worth Rs. ${Math.ceil(coupon.min_order - subtotal).toLocaleString('en-PK')} more to use this coupon.`);
  if (coupon.per_customer_limit != null && (identity.customerId || identity.phone)) {
    const used = await client.couponRedemption.count({
      where: {
        coupon_id: coupon.id,
        OR: [identity.customerId ? { customer_id: identity.customerId } : null, identity.phone ? { phone: identity.phone } : null].filter(Boolean),
      },
    });
    if (used >= coupon.per_customer_limit) throw new AppError('You have already used this coupon.');
  }
  let discount = coupon.type === 'percent' ? (subtotal * coupon.value) / 100 : coupon.value;
  if (coupon.max_discount != null) discount = Math.min(discount, coupon.max_discount);
  discount = Math.min(Math.round(discount), subtotal);
  return { coupon, discount };
}

/** Full price breakdown for a cart. Never trusts client-provided prices. */
export async function priceCart(cart, { city, paymentMethod, identity } = {}) {
  const settings = await getSettings();
  const lines = await getCartLines(cart.id);
  const subtotal = lines.reduce((s, l) => s + l.line_total, 0);

  let discount = 0;
  let couponError = null;
  const couponCode = cart.coupon_code;
  if (couponCode && lines.length) {
    try {
      discount = (await evaluateCoupon(couponCode, subtotal, identity)).discount;
    } catch (e) {
      couponError = e.message;
    }
  }
  const afterDiscount = subtotal - discount;
  const shipping = lines.length ? shippingFeeFor(settings, city, afterDiscount) : 0;
  const paymentFee = paymentMethod === 'cod' && lines.length ? Number(settings.shipping.cod_fee) || 0 : 0;
  const freeThreshold = Number(settings.shipping.free_threshold) || 0;

  return {
    lines,
    count: lines.reduce((s, l) => s + l.quantity, 0),
    subtotal,
    discount,
    coupon_code: couponCode,
    coupon_error: couponError,
    shipping,
    payment_fee: paymentFee,
    total: afterDiscount + shipping + paymentFee,
    free_shipping_threshold: freeThreshold,
    free_shipping_remaining: freeThreshold > 0 ? Math.max(0, freeThreshold - afterDiscount) : 0,
    has_issues: lines.some((l) => l.issue),
  };
}

/** Validates a requested variant + quantity against live stock. */
export async function assertPurchasable(productId, variantId, quantity) {
  const v = await prisma.productVariant.findFirst({
    where: { id: variantId, product_id: productId },
    select: { id: true, stock: true, status: true, product: { select: { status: true } } },
  });
  if (!v || v.status !== 'active' || v.product.status !== 'active') throw new AppError('Please select an available option.');
  if (v.stock <= 0) throw new AppError('Sorry, this option is out of stock.');
  if (quantity > v.stock) throw new AppError(`Only ${v.stock} left in stock.`);
  return v;
}
