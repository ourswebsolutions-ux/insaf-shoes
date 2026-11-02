import { z } from 'zod';
import { handler, ok, readJson } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { AppError } from '@/lib/errors';
import { ORDER_STATUSES, PAYMENT_STATUSES } from '@/lib/format';
import { setPaymentStatus, updateOrderStatus } from '@/lib/orders';

const schema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('status'), status: z.enum(ORDER_STATUSES), note: z.string().max(500).optional() }),
  z.object({ action: z.literal('payment'), payment_status: z.enum(PAYMENT_STATUSES), note: z.string().max(500).optional() }),
  z.object({ action: z.literal('tracking'), courier: z.string().trim().max(80).optional(), tracking_number: z.string().trim().max(80).optional(), mark_shipped: z.boolean().optional() }),
  z.object({ action: z.literal('notes'), admin_notes: z.string().max(1000) }),
]);

export const PATCH = handler(async (req, { params }) => {
  const admin = await requireAdmin('orders');
  const id = Number((await params).id) || 0;
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw new AppError('Order not found', 404);
  const d = schema.parse(await readJson(req));

  if (d.action === 'status') {
    await updateOrderStatus(id, { status: d.status, note: d.note, by: admin.name });
    return ok({ message: `Order marked as ${d.status}.` });
  }
  if (d.action === 'payment') {
    await setPaymentStatus(id, d.payment_status, { by: admin.name, adminId: admin.id, note: d.note });
    return ok({ message: 'Payment status updated.' });
  }
  if (d.action === 'tracking') {
    await prisma.order.update({ where: { id }, data: { courier: d.courier || null, tracking_number: d.tracking_number || null } });
    if (d.mark_shipped && !['shipped', 'delivered', 'cancelled', 'returned'].includes(order.status)) {
      await updateOrderStatus(id, { status: 'shipped', note: `${d.courier || 'Courier'} ${d.tracking_number || ''}`.trim(), by: admin.name });
    }
    return ok({ message: 'Tracking details saved.' });
  }
  await prisma.order.update({ where: { id }, data: { admin_notes: d.admin_notes || null } });
  return ok({ message: 'Notes saved.' });
});
