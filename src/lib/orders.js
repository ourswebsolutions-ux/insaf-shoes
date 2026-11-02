import 'server-only';
import crypto from 'node:crypto';
import { prisma } from './db';
import { AppError } from './errors';
import { effectivePrice } from './format';
import { evaluateCoupon } from './cart';
import { getSettings, publicPaymentOptions, shippingFeeFor } from './settings';

function newOrderNumber() {
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `PS${ymd}${crypto.randomInt(10000, 99999)}`;
}

const INITIAL_PAYMENT_STATUS = {
  cod: 'unpaid',
  bank_transfer: 'awaiting_payment',
  jazzcash: 'awaiting_payment',
  easypaisa: 'awaiting_payment',
};

/**
 * Creates an order from a cart inside a single transaction: re-validates every
 * line, recomputes all prices, decrements stock atomically (only if enough is
 * left) and records the coupon redemption.
 */
export async function placeOrder({ cart, customer, checkout }) {
  const settings = await getSettings();
  const allowed = publicPaymentOptions(settings).map((m) => m.id);
  if (!allowed.includes(checkout.payment_method)) throw new AppError('This payment method is not available.');

  return prisma.$transaction(async (tx) => {
    const items = await tx.cartItem.findMany({
      where: { cart_id: cart.id },
      orderBy: { id: 'asc' },
      include: {
        product: { select: { name: true, price: true, sale_price: true, status: true, sku: true, images: { orderBy: [{ sort_order: 'asc' }, { id: 'asc' }], take: 1, select: { url: true } } } },
        variant: { select: { sku: true, size: true, color: true, stock: true, price_adjustment: true, status: true } },
      },
    });
    if (!items.length) throw new AppError('Your cart is empty.');

    let subtotal = 0;
    const lines = items.map(({ product: p, variant: v, quantity, product_id, variant_id }) => {
      if (p.status !== 'active' || v.status !== 'active')
        throw new AppError(`"${p.name}" is no longer available. Please remove it from your cart.`, 409);
      if (v.stock < quantity)
        throw new AppError(v.stock > 0 ? `Only ${v.stock} left of "${p.name}". Please update your cart.` : `"${p.name}" is out of stock.`, 409);
      const unit_price = effectivePrice(p) + Number(v.price_adjustment || 0);
      subtotal += unit_price * quantity;
      return {
        product_id,
        variant_id,
        product_name: p.name,
        sku: v.sku || p.sku,
        size: v.size,
        color: v.color,
        image: p.images[0]?.url || null,
        unit_price,
        quantity,
        line_total: unit_price * quantity,
      };
    });

    let discount = 0;
    let coupon = null;
    const couponCode = checkout.coupon_code || cart.coupon_code;
    if (couponCode) {
      ({ coupon, discount } = await evaluateCoupon(couponCode, subtotal, { customerId: customer?.id, phone: checkout.phone }, tx));
    }

    const shipping = shippingFeeFor(settings, checkout.city, subtotal - discount);
    const paymentFee = checkout.payment_method === 'cod' ? Number(settings.shipping.cod_fee) || 0 : 0;
    const total = subtotal - discount + shipping + paymentFee;

    const codMax = Number(settings.payments.cod.max_order) || 0;
    if (checkout.payment_method === 'cod' && codMax > 0 && total > codMax)
      throw new AppError(`Cash on Delivery is available for orders up to Rs. ${codMax.toLocaleString('en-PK')}. Please choose another payment method.`);

    let orderNumber = newOrderNumber();
    while (await tx.order.findUnique({ where: { order_number: orderNumber }, select: { id: true } })) orderNumber = newOrderNumber();

    // Decrement stock only if enough is still available (safe against concurrent checkouts).
    for (const l of lines) {
      const { count } = await tx.productVariant.updateMany({
        where: { id: l.variant_id, stock: { gte: l.quantity } },
        data: { stock: { decrement: l.quantity } },
      });
      if (count !== 1) throw new AppError(`"${l.product_name}" just went out of stock.`, 409);
      await tx.product.update({ where: { id: l.product_id }, data: { sold_count: { increment: l.quantity } } });
    }

    const order = await tx.order.create({
      data: {
        order_number: orderNumber,
        access_token: crypto.randomBytes(16).toString('hex'),
        customer_id: customer?.id || null,
        name: checkout.name,
        phone: checkout.phone,
        email: checkout.email || null,
        address: checkout.address,
        city: checkout.city,
        province: checkout.province,
        postal_code: checkout.postal_code || null,
        notes: checkout.notes || null,
        subtotal,
        discount,
        shipping_fee: shipping,
        payment_fee: paymentFee,
        total,
        coupon_code: coupon?.code || null,
        payment_method: checkout.payment_method,
        payment_status: INITIAL_PAYMENT_STATUS[checkout.payment_method],
        status: 'pending',
        items: { create: lines },
        payments: { create: { method: checkout.payment_method, amount: total, status: 'initiated' } },
        history: { create: { status: 'pending', note: 'Order placed', created_by: 'Customer' } },
      },
      select: { id: true, order_number: true, access_token: true, total: true, payment_method: true },
    });

    if (coupon) {
      await tx.coupon.update({ where: { id: coupon.id }, data: { used_count: { increment: 1 } } });
      await tx.couponRedemption.create({ data: { coupon_id: coupon.id, order_id: order.id, customer_id: customer?.id || null, phone: checkout.phone } });
    }

    await tx.cartItem.deleteMany({ where: { cart_id: cart.id } });
    await tx.cart.update({ where: { id: cart.id }, data: { coupon_code: null } });

    if (customer && checkout.save_address) {
      const exists = await tx.address.findFirst({ where: { customer_id: customer.id, address: checkout.address, city: checkout.city } });
      if (!exists) {
        const count = await tx.address.count({ where: { customer_id: customer.id } });
        await tx.address.create({
          data: {
            customer_id: customer.id,
            name: checkout.name,
            phone: checkout.phone,
            address: checkout.address,
            city: checkout.city,
            province: checkout.province,
            postal_code: checkout.postal_code || null,
            is_default: count === 0,
          },
        });
      }
    }

    return order;
  });
}

/** Loads an order with items (plus product slugs), history and payments. */
export async function getOrder(where) {
  const order = await prisma.order.findFirst({
    where,
    include: {
      items: { orderBy: { id: 'asc' }, include: { product: { select: { slug: true } } } },
      history: { orderBy: [{ created_at: 'asc' }, { id: 'asc' }], select: { status: true, note: true, created_by: true, created_at: true } },
      payments: { orderBy: { id: 'desc' } },
    },
  });
  if (!order) return null;
  return { ...order, items: order.items.map(({ product, ...it }) => ({ ...it, slug: product?.slug || null })) };
}

const RESTOCK_STATUSES = ['cancelled', 'returned'];

/** Admin status change. Restores stock exactly once when an order is cancelled or returned. */
export async function updateOrderStatus(orderId, { status, note, by }) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order) throw new AppError('Order not found', 404);
    if (order.status === status) return order;
    if (RESTOCK_STATUSES.includes(order.status) && !RESTOCK_STATUSES.includes(status))
      throw new AppError('A cancelled or returned order cannot be reopened. Please create a new order.');

    if (RESTOCK_STATUSES.includes(status)) {
      // Claim the restock atomically so two concurrent requests can't both restock.
      const { count } = await tx.order.updateMany({ where: { id: orderId, stock_restored: false }, data: { stock_restored: true } });
      if (count === 1) {
        for (const it of order.items) {
          if (it.variant_id) await tx.productVariant.updateMany({ where: { id: it.variant_id }, data: { stock: { increment: it.quantity } } });
          if (it.product_id) {
            const p = await tx.product.findUnique({ where: { id: it.product_id }, select: { sold_count: true } });
            if (p) await tx.product.update({ where: { id: it.product_id }, data: { sold_count: Math.max(0, p.sold_count - it.quantity) } });
          }
        }
      }
    }

    await tx.order.update({ where: { id: orderId }, data: { status } });
    await tx.orderStatusHistory.create({ data: { order_id: orderId, status, note: note || null, created_by: by || null } });
    return { ...order, status };
  });
}

const PAYMENT_RECORD_STATUS = { paid: 'paid', failed: 'failed', refunded: 'refunded', pending_verification: 'pending_verification' };

/** Updates the order's payment status and its latest payment record, with a history entry. */
export async function setPaymentStatus(orderId, paymentStatus, { by, adminId, note, transactionRef, gatewayResponse, client } = {}) {
  const run = async (tx) => {
    await tx.order.update({ where: { id: orderId }, data: { payment_status: paymentStatus } });
    const latest = await tx.payment.findFirst({ where: { order_id: orderId }, orderBy: { id: 'desc' } });
    if (latest) {
      const data = {};
      if (PAYMENT_RECORD_STATUS[paymentStatus]) data.status = PAYMENT_RECORD_STATUS[paymentStatus];
      if (paymentStatus === 'paid' && adminId) Object.assign(data, { verified_by: adminId, verified_at: new Date() });
      if (transactionRef !== undefined) data.transaction_ref = transactionRef;
      if (gatewayResponse !== undefined) data.gateway_response = gatewayResponse;
      if (Object.keys(data).length) await tx.payment.update({ where: { id: latest.id }, data });
    }
    await tx.orderStatusHistory.create({ data: { order_id: orderId, status: `payment_${paymentStatus}`, note: note || null, created_by: by || null } });
  };
  return client ? run(client) : prisma.$transaction(run);
}
