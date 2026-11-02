import { prisma } from '@/lib/db';
import { setPaymentStatus } from '@/lib/orders';
import { autoSubmitPage, siteUrl, verifyOrderRef } from '@/lib/payments';
import { baseUrl } from '@/lib/payments/easypaisa';
import { getSettings } from '@/lib/settings';

// Easypay redirects back twice: first with an auth_token that must be posted to
// Confirm.jsf, then with the final status. The final redirect is not signed by
// Easypaisa, so a "success" here only moves the payment to pending_verification;
// an admin confirms it against the Easypaisa merchant portal.
async function handle(req) {
  const url = new URL(req.url);
  let params = Object.fromEntries(url.searchParams.entries());
  if (req.method === 'POST') {
    const form = await req.formData();
    params = { ...params, ...Object.fromEntries([...form.entries()].map(([k, v]) => [k, String(v)])) };
  }
  const orderNumber = params.o;
  if (!orderNumber || !verifyOrderRef(orderNumber, params.sig)) return Response.redirect(`${siteUrl()}/track-order`, 303);

  const order = await prisma.order.findUnique({ where: { order_number: orderNumber } });
  if (!order) return Response.redirect(`${siteUrl()}/track-order`, 303);
  const back = `${siteUrl()}/order/${order.order_number}?t=${order.access_token}`;

  if (params.auth_token) {
    const config = (await getSettings()).payments.easypaisa;
    const postBackURL = `${siteUrl()}/api/payments/easypaisa/callback?o=${order.order_number}&sig=${params.sig}`;
    return autoSubmitPage(`${baseUrl(config)}/Confirm.jsf`, { auth_token: params.auth_token, postBackURL }, 'Confirming your Easypaisa payment…');
  }

  const success = params.status === '0000';
  if (order.payment_status !== 'paid') {
    await setPaymentStatus(order.id, success ? 'pending_verification' : 'failed', {
      by: 'Easypaisa',
      note: `Easypaisa status ${params.status || 'unknown'} ${params.desc || ''}`.trim(),
      transactionRef: params.orderRefNumber || null,
      gatewayResponse: params,
    });
  }
  return Response.redirect(`${back}&payment=${success ? 'submitted' : 'failed'}`, 303);
}

export const GET = handle;
export const POST = handle;
