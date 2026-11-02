import { prisma } from '@/lib/db';
import { setPaymentStatus } from '@/lib/orders';
import { siteUrl } from '@/lib/payments';
import { verifyJazzCashResponse } from '@/lib/payments/jazzcash';
import { getSettings } from '@/lib/settings';

// JazzCash posts the transaction result here. Only a valid signature with
// response code 000 and a matching amount marks the order as paid.
export async function POST(req) {
  const form = await req.formData();
  const body = Object.fromEntries([...form.entries()].map(([k, v]) => [k, String(v)]));
  const config = (await getSettings()).payments.jazzcash;
  const result = verifyJazzCashResponse(body, config);

  if (!result.validSignature) {
    console.warn('[jazzcash] invalid signature for', result.txnRef);
    return Response.redirect(`${siteUrl()}/track-order?payment=failed`, 303);
  }

  const payment = await prisma.payment.findFirst({ where: { gateway_ref: result.txnRef || '', method: 'jazzcash' }, include: { order: true } });
  const order = payment?.order;
  if (!order) return Response.redirect(`${siteUrl()}/track-order?payment=failed`, 303);

  const paid = result.paid && Math.abs(result.amount - order.total) < 1;
  await prisma.$transaction(async (tx) => {
    if (order.payment_status === 'paid') {
      await tx.payment.update({ where: { id: payment.id }, data: { gateway_response: body } });
      return;
    }
    await setPaymentStatus(order.id, paid ? 'paid' : 'failed', {
      by: 'JazzCash',
      note: `JazzCash: ${result.code} ${result.message || ''}`.trim(),
      transactionRef: body.pp_RetreivalReferenceNo || result.txnRef,
      gatewayResponse: body,
      client: tx,
    });
    if (paid && order.status === 'pending') {
      await tx.order.update({ where: { id: order.id }, data: { status: 'confirmed' } });
      await tx.orderStatusHistory.create({ data: { order_id: order.id, status: 'confirmed', note: 'Payment received', created_by: 'System' } });
    }
  });

  return Response.redirect(`${siteUrl()}/order/${order.order_number}?t=${order.access_token}&payment=${paid ? 'success' : 'failed'}`, 303);
}

export async function GET() {
  return Response.redirect(`${siteUrl()}/track-order`, 303);
}
