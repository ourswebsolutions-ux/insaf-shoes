import { z } from 'zod';
import { handler, ok, readJson } from '@/lib/api';
import { getCustomer } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { AppError } from '@/lib/errors';

const schema = z.object({
  t: z.string().optional().nullable(),
  transaction_ref: z.string().trim().min(4, 'Enter the transaction ID / reference').max(120),
  payer_account: z.string().trim().max(80).optional().nullable(),
});

// Customer submits bank transfer details for verification.
export const POST = handler(async (req, { params }) => {
  const { number } = await params;
  const data = schema.parse(await readJson(req));
  const customer = await getCustomer();
  const order = await prisma.order.findUnique({ where: { order_number: number } });
  const allowed = order && ((data.t && data.t === order.access_token) || (customer && order.customer_id === customer.id));
  if (!allowed) throw new AppError('Order not found', 404);
  if (order.payment_method !== 'bank_transfer') throw new AppError('This order does not use bank transfer.');
  if (!['awaiting_payment', 'failed', 'pending_verification'].includes(order.payment_status)) throw new AppError('Payment for this order has already been processed.');

  await prisma.$transaction(async (tx) => {
    const latest = await tx.payment.findFirst({ where: { order_id: order.id }, orderBy: { id: 'desc' } });
    if (latest) {
      await tx.payment.update({
        where: { id: latest.id },
        data: { status: 'pending_verification', transaction_ref: data.transaction_ref, payer_account: data.payer_account || null },
      });
    }
    await tx.order.update({ where: { id: order.id }, data: { payment_status: 'pending_verification' } });
    await tx.orderStatusHistory.create({
      data: { order_id: order.id, status: 'payment_pending_verification', note: `Bank transfer reference: ${data.transaction_ref}`, created_by: 'Customer' },
    });
  });
  return ok({ message: 'Thank you! We will verify your payment shortly.' });
});
