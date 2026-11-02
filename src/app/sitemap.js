import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function sitemap() {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
  const [products, categories] = await Promise.all([
    query("SELECT slug, updated_at FROM products WHERE status = 'active'"),
    query("SELECT slug, updated_at FROM categories WHERE status = 'active'"),
  ]);
  const staticPages = ['', '/shop', '/new-arrivals', '/sale', '/about', '/contact', '/faq', '/track-order', '/shipping-policy', '/return-policy', '/privacy-policy', '/terms'];
  return [
    ...staticPages.map((p) => ({ url: `${base}${p}`, changeFrequency: 'weekly', priority: p === '' ? 1 : 0.6 })),
    ...categories.map((c) => ({ url: `${base}/category/${c.slug}`, lastModified: c.updated_at, changeFrequency: 'daily', priority: 0.8 })),
    ...products.map((p) => ({ url: `${base}/product/${p.slug}`, lastModified: p.updated_at, changeFrequency: 'weekly', priority: 0.7 })),
  ];
}
