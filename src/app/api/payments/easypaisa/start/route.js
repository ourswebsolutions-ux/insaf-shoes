import { prisma } from '@/lib/db';
import { autoSubmitPage, signOrderRef, siteUrl } from '@/lib/payments';
import { buildEasypaisaRequest } from '@/lib/payments/easypaisa';
import { getSettings } from '@/lib/settings';

export async function GET(req) {
  const url = new URL(req.url);
  const order = await prisma.order.findFirst({ where: { order_number: url.searchParams.get('order') || '', access_token: url.searchParams.get('t') || '' } });
  if (!order || order.payment_method !== 'easypaisa') return new Response('Order not found', { status: 404 });
  const back = `${siteUrl()}/order/${order.order_number}?t=${order.access_token}`;
  if (!['awaiting_payment', 'failed'].includes(order.payment_status) || ['cancelled', 'returned'].includes(order.status)) return Response.redirect(back, 303);

  const config = (await getSettings()).payments.easypaisa;
  if (!config.enabled || !config.store_id || !config.hash_key) return Response.redirect(`${back}&payment=unavailable`, 303);

  const postBackUrl = `${siteUrl()}/api/payments/easypaisa/callback?o=${order.order_number}&sig=${signOrderRef(order.order_number)}`;
  const { action, fields } = buildEasypaisaRequest({ config, order, postBackUrl });
  const latest = await prisma.payment.findFirst({ where: { order_id: order.id }, orderBy: { id: 'desc' } });
  if (latest) await prisma.payment.update({ where: { id: latest.id }, data: { gateway_ref: order.order_number, status: 'initiated' } });
  return autoSubmitPage(action, fields, 'Redirecting to Easypaisa…');
}
