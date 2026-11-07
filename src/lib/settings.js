import 'server-only';
import { cache } from 'react';
import { prisma } from './db';

export const DEFAULT_SETTINGS = {
  store: {
    name: 'Insaf Shoes',
    tagline: 'Walk in Style',
    about: 'Premium footwear for everyone. Shop smart, walk stylish with Insaf Shoes.',
    phone: '+92 300 1234567',
    whatsapp: '+92 300 1234567',
    email: 'info@punjabshop.pk',
    address: 'Lahore, Pakistan',
    logo: '',
    social: {
      facebook: 'https://facebook.com/',
      instagram: 'https://instagram.com/',
      youtube: 'https://youtube.com/',
      tiktok: 'https://tiktok.com/',
    },
    seo_title: 'Insaf Shoes – Premium Footwear Store in Pakistan',
    seo_description:
      'Shop trendy sneakers, formal shoes, heels, sandals and chappals online in Pakistan. Cash on Delivery, free delivery and easy returns.',
  },
  topbar: {
    left: 'Free Delivery All Over Pakistan',
    center: 'Cash on Delivery Available',
    right: '24/7 Customer Support',
  },
  shipping: {
    flat_fee: 250,
    free_threshold: 5000,
    city_fees: {},
    estimated_days: '3-5 working days',
    cod_fee: 0,
  },
  payments: {
    cod: { enabled: true, label: 'Cash on Delivery', max_order: 50000 },
    bank_transfer: {
      enabled: true,
      bank_name: 'Meezan Bank',
      account_title: 'Insaf Shoes',
      account_number: '0000-0000000000',
      iban: 'PK00MEZN0000000000000000',
      instructions: 'Transfer the total amount and submit your transaction ID on the order page. Your order will be confirmed after verification.',
    },
    jazzcash: {
      enabled: false,
      sandbox: true,
      merchant_id: '',
      password: '',
      integrity_salt: '',
    },
    easypaisa: {
      enabled: false,
      sandbox: true,
      store_id: '',
      hash_key: '',
    },
  },
  homepage: {
    sections: {
      hero: true,
      categories: true,
      best_sellers: true,
      promos: true,
      features: true,
      testimonials: true,
      newsletter: true,
      new_arrivals: false,
      featured: false,
    },
    categories_title: 'Shop by Category',
    categories_subtitle: 'Find Your Favorite Style',
    best_sellers_title: 'Best Selling Products',
    best_sellers_subtitle: 'Top Picks from Our Customers',
    best_seller_ids: [],
    featured_title: 'Featured Products',
    featured_subtitle: 'Handpicked for You',
    featured_ids: [],
    new_arrivals_title: 'New Arrivals',
    new_arrivals_subtitle: 'Fresh Styles Just In',
    features_title: 'Why Choose Insaf Shoes?',
    features: [
      { icon: 'truck', title: 'Free Delivery', text: 'All Over Pakistan' },
      { icon: 'returns', title: 'Easy Returns', text: 'Within 7 Days' },
      { icon: 'shield', title: 'Secure Payment', text: 'JazzCash / Easypaisa' },
      { icon: 'headset', title: '24/7 Support', text: 'Always Here for You' },
    ],
    testimonials_title: 'What Our Customers Say',
    newsletter_title: 'Subscribe to Our Newsletter',
    newsletter_text: 'Get the latest offers and updates.',
  },
};

function merge(base, override) {
  if (Array.isArray(base) || typeof base !== 'object' || base === null) return override ?? base;
  const out = { ...base };
  for (const [k, v] of Object.entries(override || {})) {
    out[k] = typeof v === 'object' && v !== null && !Array.isArray(v) && typeof base[k] === 'object' ? merge(base[k], v) : v;
  }
  return out;
}

export const getSettings = cache(async () => {
  const rows = await prisma.setting.findMany();
  const stored = {};
  for (const r of rows) stored[r.key] = typeof r.value === 'string' ? JSON.parse(r.value) : r.value;
  return merge(DEFAULT_SETTINGS, stored);
});

export async function saveSetting(key, value) {
  await prisma.setting.upsert({ where: { key }, create: { key, value }, update: { value } });
}

// Settings safe to send to the browser (no gateway secrets).
export function publicPaymentOptions(settings) {
  const p = settings.payments;
  const methods = [];
  if (p.cod.enabled) methods.push({ id: 'cod', label: 'Cash on Delivery', description: 'Pay in cash when your order arrives.' });
  if (p.jazzcash.enabled && p.jazzcash.merchant_id && p.jazzcash.integrity_salt)
    methods.push({ id: 'jazzcash', label: 'JazzCash', description: 'Pay securely with your JazzCash mobile account.' });
  if (p.easypaisa.enabled && p.easypaisa.store_id && p.easypaisa.hash_key)
    methods.push({ id: 'easypaisa', label: 'Easypaisa', description: 'Pay securely with your Easypaisa account.' });
  if (p.bank_transfer.enabled)
    methods.push({ id: 'bank_transfer', label: 'Bank Transfer', description: 'Transfer to our bank account and submit your transaction ID.' });
  return methods;
}

export function shippingFeeFor(settings, city, subtotal) {
  const s = settings.shipping;
  if (Number(s.free_threshold) > 0 && subtotal >= Number(s.free_threshold)) return 0;
  const cityFee = city && s.city_fees ? s.city_fees[city] : undefined;
  return Number(cityFee ?? s.flat_fee) || 0;
}
