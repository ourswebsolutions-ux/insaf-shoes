import Link from 'next/link';
import AdminPagination from '@/components/admin/Pagination';
import { pageAdmin, pageParams } from '@/lib/admin';
import { query, queryOne } from '@/lib/db';
import { formatDate, formatPrice } from '@/lib/format';

export const metadata = { title: 'Customers' };
const PER = 25;

export default async function CustomersAdmin({ searchParams }) {
  await pageAdmin('customers');
  const sp = pageParams(await searchParams, { status: '' });
  const where = ['1=1'];
  const params = [];
  if (sp.q) { where.push('(c.name LIKE ? OR c.email LIKE ? OR c.phone LIKE ?)'); params.push(`%${sp.q}%`, `%${sp.q}%`, `%${sp.q}%`); }
  if (['active', 'blocked'].includes(sp.status)) { where.push('c.status = ?'); params.push(sp.status); }
  const w = where.join(' AND ');
  const [rows, count] = await Promise.all([
    query(
      `SELECT c.*, COUNT(o.id) AS orders, COALESCE(SUM(CASE WHEN o.status NOT IN ('cancelled','returned') THEN o.total END), 0) AS spent, MAX(o.created_at) AS last_order
       FROM customers c LEFT JOIN orders o ON o.customer_id = c.id WHERE ${w} GROUP BY c.id ORDER BY c.created_at DESC LIMIT ? OFFSET ?`,
      [...params, PER, (sp.page - 1) * PER]
    ),
    queryOne(`SELECT COUNT(*) AS n FROM customers c WHERE ${w}`, params),
  ]);
  return (
    <>
      <div className="page-bar"><div><h1>Customers</h1><p>Registered customer accounts. Guest orders appear under Orders.</p></div></div>
      <section className="panel">
        <form className="filters-bar" method="get">
          <input type="search" name="q" className="input" placeholder="Name, email or phone…" defaultValue={sp.q} />
          <select name="status" className="select" defaultValue={sp.status}>
            <option value="">Any status</option><option value="active">Active</option><option value="blocked">Blocked</option>
          </select>
          <button className="btn btn--outline btn--sm">Filter</button>
        </form>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Customer</th><th>Phone</th><th>Orders</th><th>Total spent</th><th>Last order</th><th>Joined</th><th>Status</th></tr></thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  <td><Link href={`/admin/customers/${c.id}`} className="link">{c.name}</Link><br /><small className="muted">{c.email}</small></td>
                  <td>{c.phone || '—'}</td>
                  <td>{c.orders}</td>
                  <td className="nowrap">{formatPrice(c.spent)}</td>
                  <td className="nowrap muted">{c.last_order ? formatDate(c.last_order) : '—'}</td>
                  <td className="nowrap muted">{formatDate(c.created_at)}</td>
                  <td><span className={`status status--${c.status}`}>{c.status}</span></td>
                </tr>
              ))}
              {!rows.length && <tr><td colSpan={7} className="muted" style={{ textAlign: 'center', padding: 40 }}>No customers found.</td></tr>}
            </tbody>
          </table>
        </div>
        <AdminPagination page={sp.page} pages={Math.ceil(count.n / PER)} total={count.n} basePath="/admin/customers" params={sp} />
      </section>
    </>
  );
}
