import Link from 'next/link';
import InventoryEditor from '@/components/admin/InventoryEditor';
import AdminPagination from '@/components/admin/Pagination';
import { pageAdmin, pageParams } from '@/lib/admin';
import { query, queryOne } from '@/lib/db';

export const metadata = { title: 'Stock' };
const PER = 50;

export default async function InventoryAdmin({ searchParams }) {
  await pageAdmin('catalog');
  const sp = pageParams(await searchParams, { filter: '' });
  const where = ["v.status = 'active'"];
  const params = [];
  if (sp.q) { where.push('(p.name LIKE ? OR v.sku LIKE ? OR p.sku LIKE ?)'); params.push(`%${sp.q}%`, `%${sp.q}%`, `%${sp.q}%`); }
  if (sp.filter === 'out') where.push('v.stock <= 0');
  if (sp.filter === 'low') where.push('v.stock <= p.low_stock_threshold');
  const w = where.join(' AND ');
  const [rows, count, totals] = await Promise.all([
    query(
      `SELECT v.id, v.product_id, v.size, v.color, v.sku, v.stock, p.name, p.status AS product_status, p.low_stock_threshold,
         (SELECT url FROM product_images WHERE product_id = p.id ORDER BY sort_order LIMIT 1) AS image
       FROM product_variants v JOIN products p ON p.id = v.product_id WHERE ${w} ORDER BY p.name, v.color, CAST(v.size AS DECIMAL(6,1)), v.size LIMIT ? OFFSET ?`,
      [...params, PER, (sp.page - 1) * PER]
    ),
    queryOne(`SELECT COUNT(*) AS n FROM product_variants v JOIN products p ON p.id = v.product_id WHERE ${w}`, params),
    queryOne(`SELECT COALESCE(SUM(v.stock),0) AS units, SUM(v.stock <= 0) AS out_count, SUM(v.stock > 0 AND v.stock <= p.low_stock_threshold) AS low_count
              FROM product_variants v JOIN products p ON p.id = v.product_id WHERE v.status = 'active'`),
  ]);
  return (
    <>
      <div className="page-bar"><div><h1>Stock</h1><p>{totals.units} pieces in stock · {totals.low_count} sizes running low · {totals.out_count} sizes sold out. Change the numbers and click Save.</p></div></div>
      <nav className="tabs-nav">
        <Link href="/admin/inventory" className={!sp.filter ? 'is-active' : ''}>Everything</Link>
        <Link href="/admin/inventory?filter=low" className={sp.filter === 'low' ? 'is-active' : ''}>Running low</Link>
        <Link href="/admin/inventory?filter=out" className={sp.filter === 'out' ? 'is-active' : ''}>Sold out</Link>
      </nav>
      <form className="panel filters-bar" method="get">
        <input type="search" name="q" className="input" placeholder="Search product or SKU…" defaultValue={sp.q} />
        {sp.filter && <input type="hidden" name="filter" value={sp.filter} />}
        <button className="btn btn--outline btn--sm">Search</button>
      </form>
      <InventoryEditor key={JSON.stringify(sp)} rows={rows} />
      <AdminPagination page={sp.page} pages={Math.ceil(count.n / PER)} total={count.n} basePath="/admin/inventory" params={sp} />
    </>
  );
}
