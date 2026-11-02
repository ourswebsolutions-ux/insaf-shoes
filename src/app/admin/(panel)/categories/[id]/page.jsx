import Link from 'next/link';
import { notFound } from 'next/navigation';
import AdminPagination from '@/components/admin/Pagination';
import CategoryDetailActions from '@/components/admin/CategoryDetailActions';
import ProductsTable from '@/components/admin/ProductsTable';
import { categoryFamily } from '@/lib/admin-catalog';
import { pageAdmin, pageParams } from '@/lib/admin';
import { categoriesWithCounts } from '@/lib/admin-categories';
import { productRows } from '@/lib/admin-products';

export const metadata = { title: 'Category' };
const PER = 50;

export default async function CategoryAdminPage({ params, searchParams }) {
  await pageAdmin('catalog');
  const id = Number((await params).id) || 0;
  const sp = pageParams(await searchParams);
  const categories = JSON.parse(JSON.stringify(await categoriesWithCounts()));
  const category = categories.find((c) => c.id === id);
  if (!category) notFound();
  const children = categories.filter((c) => c.parent_id === id);
  const { ids } = await categoryFamily(id);
  const where = { categories: { some: { category_id: { in: ids } } } };
  if (sp.q) where.OR = [{ name: { contains: sp.q } }, { sku: { contains: sp.q } }];
  const { products, total } = await productRows(where, { skip: (sp.page - 1) * PER, take: PER });

  return (
    <>
      <div className="page-bar">
        <div>
          <Link href="/admin/categories" className="link" style={{ fontSize: 13 }}>← All categories</Link>
          <h1 style={{ marginTop: 4 }}>{category.parent_name ? `${category.parent_name} › ` : ''}{category.name}</h1>
          <p>{category.product_count} product{category.product_count === 1 ? '' : 's'}{children.length ? `, including ${children.length} sub-categories` : ''}.</p>
        </div>
        <CategoryDetailActions category={{ ...category, has_children: children.length > 0 }} categories={categories} productCount={category.product_count} />
      </div>
      {children.length > 0 && (
        <div className="stat-row">
          {children.map((c) => (
            <Link key={c.id} href={`/admin/categories/${c.id}`} className="stat-pill"><b>{c.product_count}</b>{c.name}</Link>
          ))}
        </div>
      )}
      <section className="panel">
        <form className="filters-bar" method="get">
          <input type="search" name="q" className="input" placeholder={`Search in ${category.name}…`} defaultValue={sp.q} aria-label="Search products" />
          <button className="btn btn--primary btn--sm">Search</button>
          {sp.q && <Link href={`/admin/categories/${id}`} className="link" style={{ fontSize: 14 }}>Clear</Link>}
          <Link href="/admin/products/new" className="btn btn--outline btn--sm" style={{ marginLeft: 'auto' }}>Add Product</Link>
        </form>
        <ProductsTable products={products} emptyText="This category has no products yet." />
        <AdminPagination page={sp.page} pages={Math.ceil(total / PER)} total={total} basePath={`/admin/categories/${id}`} params={sp} />
      </section>
    </>
  );
}
