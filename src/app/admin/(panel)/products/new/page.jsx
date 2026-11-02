import ProductForm from '@/components/admin/ProductForm';
import { pageAdmin } from '@/lib/admin';
import { getCategories } from '@/lib/catalog';
import { queryOne } from '@/lib/db';

export const metadata = { title: 'Add Product' };

export default async function NewProductPage() {
  await pageAdmin('catalog');
  const [categories, last] = await Promise.all([getCategories({ includeInactive: true }), queryOne('SELECT MAX(id) AS id FROM products')]);
  const initial = {
    name: '', slug: '', sku: `PS-${1001 + (last.id || 0)}`, short_description: '', description: '', price: '', sale_price: '',
    status: 'active', is_featured: false, is_best_seller: false, is_new_arrival: true, low_stock_threshold: 5,
    seo_title: '', seo_description: '', category_ids: [], images: [],
    variants: [{ size: null, color: null, color_hex: null, sku: '', stock: 10, price_adjustment: 0, status: 'active' }],
  };
  return <ProductForm initial={initial} categories={categories.map((c) => ({ id: c.id, name: c.name, parent_id: c.parent_id }))} />;
}
