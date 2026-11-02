import 'server-only';
import crypto from 'node:crypto';

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

/** Minimal page that POSTs the given fields to a payment gateway. */
export function autoSubmitPage(action, fields, message = 'Redirecting to secure payment…') {
  const inputs = Object.entries(fields)
    .map(([k, v]) => `<input type="hidden" name="${esc(k)}" value="${esc(v)}">`)
    .join('');
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Redirecting…</title>
<style>body{font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;color:#17501b;background:#f2f8ef}button{margin-top:12px;padding:10px 18px;border:0;border-radius:999px;background:#17501b;color:#fff;font-weight:600}</style></head>
<body><form id="f" method="post" action="${esc(action)}">${inputs}<p>${esc(message)}</p><noscript><button type="submit">Continue</button></noscript></form>
<script>document.getElementById('f').submit()</script></body></html>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
}

/** Signs an order number so gateway return URLs cannot be forged to reveal order access tokens. */
export function signOrderRef(orderNumber) {
  return crypto.createHmac('sha256', process.env.JWT_SECRET || '').update(`order:${orderNumber}`).digest('hex').slice(0, 32);
}

export function verifyOrderRef(orderNumber, sig) {
  const expected = signOrderRef(orderNumber);
  return typeof sig === 'string' && sig.length === expected.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}
