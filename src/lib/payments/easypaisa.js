import 'server-only';
import crypto from 'node:crypto';

// Easypaisa "Easypay" hosted checkout (two-step redirect).
const ENDPOINTS = {
  sandbox: 'https://easypaystg.easypaisa.com.pk/easypay',
  live: 'https://easypay.easypaisa.com.pk/easypay',
};

export function baseUrl(config) {
  return config.sandbox ? ENDPOINTS.sandbox : ENDPOINTS.live;
}

function expiry(date) {
  const d = new Date(date.getTime() + 5 * 60 * 60 * 1000 + 24 * 60 * 60 * 1000);
  const s = d.toISOString();
  return `${s.slice(0, 10).replace(/-/g, '')} ${s.slice(11, 19).replace(/:/g, '')}`;
}

export function hashRequest(fields, hashKey) {
  const plain = Object.keys(fields)
    .sort()
    .map((k) => `${k}=${fields[k]}`)
    .join('&');
  const key = Buffer.from(hashKey, 'utf8');
  const cipher = crypto.createCipheriv(`aes-${key.length * 8}-ecb`, key, null);
  return Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]).toString('base64');
}

export function buildEasypaisaRequest({ config, order, postBackUrl }) {
  const fields = {
    amount: Number(order.total).toFixed(1),
    autoRedirect: '1',
    emailAddr: order.email || '',
    expiryDate: expiry(new Date()),
    mobileNum: order.phone,
    orderRefNum: order.order_number,
    paymentMethod: 'MA_PAYMENT_METHOD',
    postBackURL: postBackUrl,
    storeId: config.store_id,
  };
  const merchantHashedReq = hashRequest(fields, config.hash_key);
  return { action: `${baseUrl(config)}/Index.jsf`, fields: { ...fields, merchantHashedReq } };
}
