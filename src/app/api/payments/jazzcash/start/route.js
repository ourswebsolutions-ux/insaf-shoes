import { prisma } from '@/lib/db';
import { autoSubmitPage, siteUrl } from '@/lib/payments';
import { buildJazzCashRequest } from '@/lib/payments/jazzcash';
import { getSettings } from '@/lib/settings';

export async function GET(req) {
  const url = new URL(req.url);
  const order = await prisma.order.findFirst({ where: { order_number: url.searchParams.get('order') || '', access_token: url.searchParams.get('t') || '' } });
  if (!order || order.payment_method !== 'jazzcash') return new Response('Order not found', { status: 404 });
  const back = `${siteUrl()}/order/${order.order_number}?t=${order.access_token}`;
  if (!['awaiting_payment', 'failed'].includes(order.payment_status) || ['cancelled', 'returned'].includes(order.status)) return Response.redirect(back, 303);

  const config = (await getSettings()).payments.jazzcash;
  if (!config.enabled || !config.merchant_id || !config.integrity_salt) return Response.redirect(`${back}&payment=unavailable`, 303);

  const { action, fields, txnRef } = buildJazzCashRequest({ config, order, returnUrl: `${siteUrl()}/api/payments/jazzcash/callback` });
  const latest = await prisma.payment.findFirst({ where: { order_id: order.id }, orderBy: { id: 'desc' } });
  if (latest) await prisma.payment.update({ where: { id: latest.id }, data: { gateway_ref: txnRef, status: 'initiated' } });
  return autoSubmitPage(action, fields, 'Redirecting to JazzCash…');
}
