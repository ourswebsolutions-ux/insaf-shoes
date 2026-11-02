import { notFound } from 'next/navigation';
import ProductForm from '@/components/admin/ProductForm';
import { pageAdmin } from '@/lib/admin';
import { getCategories } from '@/lib/catalog';
import { query, queryOne } from '@/lib/db';

export const metadata = { title: 'Edit Product' };

export default async function EditProductPage({ params, searchParams }) {
  await pageAdmin('catalog');
  const { id } = await params;
  const sp = await searchParams;
  const p = await queryOne('SELECT * FROM products WHERE id = ?', [Number(id) || 0]);
  if (!p) notFound();
  const [images, variants, cats, categories] = await Promise.all([
    query('SELECT url, alt FROM product_images WHERE product_id = ? ORDER BY sort_order, id', [p.id]),
    query('SELECT id, sku, size, color, color_hex, price_adjustment, stock, status FROM product_variants WHERE product_id = ? ORDER BY id', [p.id]),
    query('SELECT category_id FROM product_categories WHERE product_id = ?', [p.id]),
    getCategories({ includeInactive: true }),
  ]);
  const initial = {
    id: p.id, name: p.name, slug: p.slug, sku: p.sku, short_description: p.short_description || '', description: p.description || '',
    price: p.price, sale_price: p.sale_price ?? '', status: p.status, is_featured: !!p.is_featured, is_best_seller: !!p.is_best_seller,
    is_new_arrival: !!p.is_new_arrival, low_stock_threshold: p.low_stock_threshold, seo_title: p.seo_title || '', seo_description: p.seo_description || '',
    category_ids: cats.map((c) => c.category_id), images: images.map((i) => ({ url: i.url, alt: i.alt || '' })),
    variants: variants.map((v) => ({ ...v, price_adjustment: Number(v.price_adjustment) })),
  };
  return (
    <>
      {sp.created && <p className="form-success">Product created successfully.</p>}
      <ProductForm key={p.updated_at?.toString()} initial={initial} categories={categories.map((c) => ({ id: c.id, name: c.name, parent_id: c.parent_id }))} />
    </>
  );
}
