import Image from 'next/image';
import Link from 'next/link';
import Icon from '@/components/Icon';
import SalesChart from '@/components/admin/SalesChart';
import { StatusBadge } from '@/components/store/order/OrderDetails';
import { pageAdmin } from '@/lib/admin';
import { query, queryOne } from '@/lib/db';
import { formatDate, formatPrice } from '@/lib/format';

export const metadata = { title: 'Dashboard' };

const REVENUE_STATUSES = "status NOT IN ('cancelled','returned')";

export default async function Dashboard({ searchParams }) {
  const admin = await pageAdmin('dashboard');
  const sp = await searchParams;
  const [kpi, daily, recent, best] = await Promise.all([
    queryOne(`SELECT
      (SELECT COALESCE(SUM(total), 0) FROM orders WHERE ${REVENUE_STATUSES}) AS revenue,
      (SELECT COALESCE(SUM(total), 0) FROM orders WHERE ${REVENUE_STATUSES} AND created_at >= NOW() - INTERVAL 30 DAY) AS revenue_30,
      (SELECT COUNT(*) FROM orders) AS orders,
      (SELECT COUNT(*) FROM orders WHERE created_at >= CURDATE()) AS orders_today,
      (SELECT COUNT(*) FROM products) AS products,
      (SELECT COUNT(*) FROM products WHERE status = 'active') AS active_products,
      (SELECT COUNT(*) FROM customers) AS customers,
      (SELECT COUNT(*) FROM customers WHERE created_at >= NOW() - INTERVAL 30 DAY) AS new_customers,
      (SELECT COUNT(*) FROM orders WHERE status = 'pending') AS pending`),
    query(`SELECT DATE(created_at) AS d, COALESCE(SUM(total), 0) AS revenue, COUNT(*) AS orders FROM orders
           WHERE ${REVENUE_STATUSES} AND created_at >= CURDATE() - INTERVAL 29 DAY GROUP BY DATE(created_at)`),
    query('SELECT id, order_number, name, city, total, status, payment_method, created_at FROM orders ORDER BY created_at DESC LIMIT 8'),
    query(`SELECT oi.product_id, MAX(oi.product_name) AS name, SUM(oi.quantity) AS qty, SUM(oi.line_total) AS revenue,
             (SELECT url FROM product_images pi WHERE pi.product_id = oi.product_id ORDER BY sort_order LIMIT 1) AS image
           FROM order_items oi JOIN orders o ON o.id = oi.order_id
           WHERE o.${REVENUE_STATUSES} AND oi.product_id IS NOT NULL
           GROUP BY oi.product_id ORDER BY qty DESC LIMIT 6`),
  ]);

  const byDay = new Map(daily.map((r) => [new Date(r.d).toISOString().slice(0, 10), r]));
  const series = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - 29 + i);
    const key = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    const r = byDay.get(key);
    return { date: key, label: d.toLocaleDateString('en-PK', { day: 'numeric', month: 'short' }), revenue: Number(r?.revenue || 0), orders: Number(r?.orders || 0) };
  });
  const maxQty = Math.max(1, ...best.map((b) => Number(b.qty)));

  const cards = [
    { label: 'Total Sales', value: formatPrice(kpi.revenue), sub: `${formatPrice(kpi.revenue_30)} in the last 30 days`, icon: 'cash' },
    { label: 'Total Orders', value: kpi.orders, sub: `${kpi.orders_today} today`, icon: 'cart', href: '/admin/orders' },
    { label: 'Pending Orders', value: kpi.pending, sub: kpi.pending ? 'Waiting for you to confirm' : 'All caught up', icon: 'clock', href: '/admin/orders?status=pending', warn: kpi.pending > 0 },
    { label: 'Total Products', value: kpi.products, sub: `${kpi.active_products} shown in shop`, icon: 'box', href: '/admin/products' },
    { label: 'Total Customers', value: kpi.customers, sub: `${kpi.new_customers} new in 30 days`, icon: 'users', href: '/admin/customers' },
  ];

  return (
    <>
      <div className="page-bar">
        <div>
          <h1>Welcome back, {admin.name.split(' ')[0]}</h1>
          <p>Here’s how your shop is doing.</p>
        </div>
        <div className="page-bar__actions">
          <Link href="/admin/products/new" className="btn btn--primary btn--sm"><Icon name="plus" size={16} /> Add Product</Link>
          <Link href="/admin/orders" className="btn btn--outline btn--sm">See Orders</Link>
        </div>
      </div>
      {sp.denied && <p className="form-error">You don’t have permission to access that section.</p>}

      <div className="kpis">
        {cards.map((c) => {
          const body = (
            <>
              <span className="kpi__icon"><Icon name={c.icon} size={22} /></span>
              <div>
                <div className="kpi__label">{c.label}</div>
                <div className="kpi__value">{c.value}</div>
                <div className="kpi__sub">{c.sub}</div>
              </div>
            </>
          );
          return c.href ? (
            <Link key={c.label} href={c.href} className={`kpi ${c.warn ? 'kpi--warn' : ''}`}>{body}</Link>
          ) : (
            <div key={c.label} className="kpi">{body}</div>
          );
        })}
      </div>

      <div className="admin-grid-2">
        <section className="panel">
          <div className="panel__head">
            <h3>Sales – last 30 days</h3>
            <span className="muted" style={{ fontSize: 13 }}>Point at a bar to see that day</span>
          </div>
          <div className="panel__body"><SalesChart data={series} /></div>
        </section>
        <section className="panel">
          <div className="panel__head"><h3>Best Selling Products</h3></div>
          <div className="panel__body">
            {best.length === 0 && <p className="muted">No sales yet. Your best sellers will appear here.</p>}
            <div className="bar-list">
              {best.map((b) => (
                <div className="bar-list__row" key={b.product_id}>
                  <span className="thumb" style={{ width: 40, height: 40 }}>{b.image && <Image src={b.image} alt="" fill sizes="40px" />}</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }}>{b.name}</div>
                    <div className="bar-list__meter"><span style={{ width: `${(Number(b.qty) / maxQty) * 100}%` }} /></div>
                  </div>
                  <span className="text-right" style={{ fontSize: 13 }}>
                    <b>{b.qty} sold</b>
                    <br />
                    <span className="muted">{formatPrice(b.revenue)}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

        <section className="panel">
          <div className="panel__head">
            <h3>Recent Orders</h3>
            <Link href="/admin/orders" className="link" style={{ fontSize: 14 }}>View all</Link>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {recent.map((o) => (
                  <tr key={o.id}>
                    <td><Link href={`/admin/orders/${o.id}`} className="link">#{o.order_number}</Link></td>
                    <td>{o.name}<br /><small className="muted">{o.city}</small></td>
                    <td className="nowrap">{formatPrice(o.total)}</td>
                    <td><StatusBadge value={o.status} /></td>
                    <td className="nowrap muted">{formatDate(o.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
    </>
  );
}
