export function formatPrice(value) {
  const n = Math.round(Number(value) || 0);
  return `Rs. ${n.toLocaleString('en-PK')}`;
}

export function discountPercent(price, salePrice) {
  if (!salePrice || Number(salePrice) >= Number(price)) return 0;
  return Math.round(((price - salePrice) / price) * 100);
}

export function effectivePrice(product) {
  const sale = Number(product.sale_price);
  return sale > 0 && sale < Number(product.price) ? sale : Number(product.price);
}

export function formatDate(value, withTime = false) {
  if (!value) return '';
  const d = new Date(value);
  return d.toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
}

export function formatCount(n) {
  n = Number(n) || 0;
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '')}k`;
  return String(n);
}

export const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'];
export const PAYMENT_STATUSES = ['unpaid', 'awaiting_payment', 'pending_verification', 'paid', 'failed', 'refunded'];

export const PAYMENT_LABELS = {
  cod: 'Cash on Delivery',
  jazzcash: 'JazzCash',
  easypaisa: 'Easypaisa',
  bank_transfer: 'Bank Transfer',
};

export function humanize(s) {
  return String(s || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
