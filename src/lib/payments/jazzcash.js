import 'server-only';
import crypto from 'node:crypto';

// JazzCash Hosted Checkout (Page Redirection, API v1.1).
const ENDPOINTS = {
  sandbox: 'https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/',
  live: 'https://payments.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/',
};

function pktTimestamp(date) {
  // JazzCash expects yyyyMMddHHmmss in Pakistan time (UTC+5).
  const d = new Date(date.getTime() + 5 * 60 * 60 * 1000);
  return d.toISOString().replace(/[-:T]/g, '').slice(0, 14);
}

export function secureHash(fields, salt) {
  const values = Object.keys(fields)
    .filter((k) => k.startsWith('pp_') && k !== 'pp_SecureHash' && fields[k] !== '' && fields[k] != null)
    .sort()
    .map((k) => fields[k]);
  const message = [salt, ...values].join('&');
  return crypto.createHmac('sha256', salt).update(message).digest('hex').toUpperCase();
}

export function buildJazzCashRequest({ config, order, returnUrl }) {
  const now = new Date();
  const txnRef = `T${pktTimestamp(now)}${order.id}`;
  const fields = {
    pp_Version: '1.1',
    pp_TxnType: '',
    pp_Language: 'EN',
    pp_MerchantID: config.merchant_id,
    pp_SubMerchantID: '',
    pp_Password: config.password,
    pp_BankID: 'TBANK',
    pp_ProductID: 'RETL',
    pp_TxnRefNo: txnRef,
    pp_Amount: String(Math.round(Number(order.total) * 100)),
    pp_TxnCurrency: 'PKR',
    pp_TxnDateTime: pktTimestamp(now),
    pp_BillReference: order.order_number,
    pp_Description: `Insaf Shoes order ${order.order_number}`,
    pp_TxnExpiryDateTime: pktTimestamp(new Date(now.getTime() + 24 * 60 * 60 * 1000)),
    pp_ReturnURL: returnUrl,
    ppmpf_1: order.order_number,
  };
  fields.pp_SecureHash = secureHash(fields, config.integrity_salt);
  return { action: config.sandbox ? ENDPOINTS.sandbox : ENDPOINTS.live, fields, txnRef };
}

/** Verifies the gateway's signed response. Only a valid hash + code 000 counts as paid. */
export function verifyJazzCashResponse(body, config) {
  const expected = secureHash(body, config.integrity_salt);
  const given = String(body.pp_SecureHash || '');
  const validSignature =
    given.length === expected.length && crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected));
  return {
    validSignature,
    paid: validSignature && body.pp_ResponseCode === '000',
    txnRef: body.pp_TxnRefNo,
    orderNumber: body.pp_BillReference || body.ppmpf_1,
    amount: Number(body.pp_Amount || 0) / 100,
    message: body.pp_ResponseMessage,
    code: body.pp_ResponseCode,
  };
}
