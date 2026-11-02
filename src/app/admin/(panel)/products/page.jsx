import Link from 'next/link';
import Icon from '@/components/Icon';
import AdminPagination from '@/components/admin/Pagination';
import ProductsTable from '@/components/admin/ProductsTable';
import { categoryFamily } from '@/lib/admin-catalog';
import { pageAdmin, pageParams } from '@/lib/admin';
import { productRows } from '@/lib/admin-products';
import { prisma } from '@/lib/db';

export const metadata = { title: 'Manage Products' };
const PER = 25;

export default async function ProductsAdmin({ searchParams }) {
  await pageAdmin('catalog');
  const sp = pageParams(await searchParams, { category: '', status: '' });
  const where = {};
  if (sp.q) where.OR = [{ name: { contains: sp.q } }, { sku: { contains: sp.q } }];
  if (Number(sp.category)) where.categories = { some: { category_id: { in: (await categoryFamily(Number(sp.category))).ids } } };
  if (sp.status === 'shown') where.status = 'active';
  if (sp.status === 'hidden') where.status = 'inactive';

  const [{ products, total }, categories, all] = await Promise.all([
    productRows(where, { skip: (sp.page - 1) * PER, take: PER }),
    prisma.category.findMany({ orderBy: [{ sort_order: 'asc' }, { name: 'asc' }], select: { id: true, name: true, parent_id: true } }),
    prisma.product.count(),
  ]);
  const roots = categories.filter((c) => !c.parent_id);
  const filtered = sp.q || sp.category || sp.status;

  return (
    <>
      <div className="page-bar">
        <div>
          <h1>Manage Products</h1>
          <p>{all} products in your shop. Tick products to show, hide or delete several at once.</p>
        </div>
        <Link href="/admin/products/new" className="btn btn--primary"><Icon name="plus" size={18} /> Add Product</Link>
      </div>
      <section className="panel">
        <form className="filters-bar" method="get">
          <input type="search" name="q" className="input" placeholder="Search by product name or code…" defaultValue={sp.q} aria-label="Search products" />
          <select name="category" className="select" defaultValue={sp.category} aria-label="Category">
            <option value="">All categories</option>
            {roots.map((r) => [
              <option key={r.id} value={r.id}>{r.name}</option>,
              ...categories.filter((c) => c.parent_id === r.id).map((c) => <option key={c.id} value={c.id}>&nbsp;&nbsp;— {c.name}</option>),
            ])}
          </select>
          <select name="status" className="select" defaultValue={sp.status} aria-label="Shown or hidden">
            <option value="">Shown and hidden</option>
            <option value="shown">Shown in shop</option>
            <option value="hidden">Hidden from shop</option>
          </select>
          <button className="btn btn--primary btn--sm">Search</button>
          {filtered && <Link href="/admin/products" className="link" style={{ fontSize: 14 }}>Clear</Link>}
        </form>
        <ProductsTable products={products} emptyText={filtered ? 'No products match your search.' : 'No products yet. Click “Add Product” to add your first one.'} />
        <AdminPagination page={sp.page} pages={Math.ceil(total / PER)} total={total} basePath="/admin/products" params={sp} />
      </section>
    </>
  );
}
