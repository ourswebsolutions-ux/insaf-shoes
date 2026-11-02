import Link from 'next/link';
import AdminPagination from '@/components/admin/Pagination';
import { StatusBadge } from '@/components/store/order/OrderDetails';
import { pageAdmin, pageParams } from '@/lib/admin';
import { query, queryOne } from '@/lib/db';
import { formatDate, formatPrice, humanize, ORDER_STATUSES, PAYMENT_LABELS, PAYMENT_STATUSES } from '@/lib/format';

export const metadata = { title: 'Orders' };
const PER = 25;

export default async function OrdersAdmin({ searchParams }) {
  await pageAdmin('orders');
  const sp = pageParams(await searchParams, { status: '', payment: '', method: '', from: '', to: '' });
  const where = ['1=1'];
  const params = [];
  if (sp.q) {
    where.push('(order_number LIKE ? OR name LIKE ? OR phone LIKE ? OR email LIKE ? OR tracking_number = ?)');
    params.push(`%${sp.q}%`, `%${sp.q}%`, `%${sp.q.replace(/\D/g, '') || sp.q}%`, `%${sp.q}%`, sp.q);
  }
  if (ORDER_STATUSES.includes(sp.status)) { where.push('status = ?'); params.push(sp.status); }
  if (PAYMENT_STATUSES.includes(sp.payment)) { where.push('payment_status = ?'); params.push(sp.payment); }
  if (PAYMENT_LABELS[sp.method]) { where.push('payment_method = ?'); params.push(sp.method); }
  if (/^\d{4}-\d{2}-\d{2}$/.test(sp.from)) { where.push('created_at >= ?'); params.push(sp.from); }
  if (/^\d{4}-\d{2}-\d{2}$/.test(sp.to)) { where.push('created_at < ? + INTERVAL 1 DAY'); params.push(sp.to); }
  const w = where.join(' AND ');

  const [rows, count, statusCounts] = await Promise.all([
    query(`SELECT o.*, (SELECT SUM(quantity) FROM order_items WHERE order_id = o.id) AS items FROM orders o WHERE ${w} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...params, PER, (sp.page - 1) * PER]),
    queryOne(`SELECT COUNT(*) AS n, COALESCE(SUM(total),0) AS value FROM orders WHERE ${w}`, params),
    query('SELECT status, COUNT(*) AS n FROM orders GROUP BY status'),
  ]);
  const sc = Object.fromEntries(statusCounts.map((r) => [r.status, r.n]));

  return (
    <>
      <div className="page-bar">
        <div><h1>Orders</h1><p>{count.n} orders · {formatPrice(count.value)}</p></div>
      </div>
      <nav className="tabs-nav">
        <Link href="/admin/orders" className={!sp.status ? 'is-active' : ''}>All</Link>
        {ORDER_STATUSES.map((s) => (
          <Link key={s} href={`/admin/orders?status=${s}`} className={sp.status === s ? 'is-active' : ''}>{humanize(s)} ({sc[s] || 0})</Link>
        ))}
      </nav>
      <section className="panel">
        <form className="filters-bar" method="get">
          <input type="search" name="q" className="input" placeholder="Order #, name, phone, email, tracking…" defaultValue={sp.q} />
          {sp.status && <input type="hidden" name="status" value={sp.status} />}
          <select name="payment" className="select" defaultValue={sp.payment}>
            <option value="">Any payment status</option>
            {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{humanize(s)}</option>)}
          </select>
          <select name="method" className="select" defaultValue={sp.method}>
            <option value="">Any method</option>
            {Object.entries(PAYMENT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <input type="date" name="from" className="input" defaultValue={sp.from} aria-label="From date" />
          <input type="date" name="to" className="input" defaultValue={sp.to} aria-label="To date" />
          <button className="btn btn--outline btn--sm">Filter</button>
          <Link href="/admin/orders" className="link" style={{ fontSize: 14 }}>Reset</Link>
        </form>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.id}>
                  <td><Link href={`/admin/orders/${o.id}`} className="link">#{o.order_number}</Link></td>
                  <td>{o.name}<br /><small className="muted">{o.phone} · {o.city}</small></td>
                  <td>{o.items}</td>
                  <td className="nowrap"><b>{formatPrice(o.total)}</b></td>
                  <td>{PAYMENT_LABELS[o.payment_method]}<br /><StatusBadge value={o.payment_status} /></td>
                  <td><StatusBadge value={o.status} /></td>
                  <td className="nowrap muted">{formatDate(o.created_at, true)}</td>
                </tr>
              ))}
              {!rows.length && <tr><td colSpan={7} className="muted" style={{ textAlign: 'center', padding: 40 }}>No orders match these filters.</td></tr>}
            </tbody>
          </table>
        </div>
        <AdminPagination page={sp.page} pages={Math.ceil(count.n / PER)} total={count.n} basePath="/admin/orders" params={sp} />
      </section>
    </>
  );
}
