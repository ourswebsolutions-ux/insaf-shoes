import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ActionButton } from '@/components/admin/SmallActions';
import { StatusBadge } from '@/components/store/order/OrderDetails';
import { pageAdmin } from '@/lib/admin';
import { query, queryOne } from '@/lib/db';
import { formatDate, formatPrice, PAYMENT_LABELS } from '@/lib/format';

export const metadata = { title: 'Customer' };

export default async function CustomerAdmin({ params }) {
  await pageAdmin('customers');
  const { id } = await params;
  const c = await queryOne('SELECT * FROM customers WHERE id = ?', [Number(id) || 0]);
  if (!c) notFound();
  const [orders, addresses, wish] = await Promise.all([
    query('SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC', [c.id]),
    query('SELECT * FROM addresses WHERE customer_id = ? ORDER BY is_default DESC', [c.id]),
    queryOne('SELECT COUNT(*) AS n FROM wishlist WHERE customer_id = ?', [c.id]),
  ]);
  const spent = orders.filter((o) => !['cancelled', 'returned'].includes(o.status)).reduce((s, o) => s + Number(o.total), 0);
  return (
    <>
      <div className="page-bar">
        <div>
          <Link href="/admin/customers" className="link" style={{ fontSize: 13 }}>← All customers</Link>
          <h1 style={{ marginTop: 4 }}>{c.name}</h1>
          <p>{c.email} · {c.phone || 'no phone'} · joined {formatDate(c.created_at)} · <span className={`status status--${c.status}`}>{c.status}</span></p>
        </div>
        <div className="page-bar__actions">
          {c.status === 'active' ? (
            <ActionButton url={`/api/admin/customers/${c.id}`} body={{ status: 'blocked' }} className="btn btn--danger btn--sm" confirmText="Block this customer? They will not be able to log in.">Block customer</ActionButton>
          ) : (
            <ActionButton url={`/api/admin/customers/${c.id}`} body={{ status: 'active' }}>Unblock customer</ActionButton>
          )}
        </div>
      </div>
      <div className="kpis">
        <div className="kpi"><div><div className="kpi__label">Orders</div><div className="kpi__value">{orders.length}</div></div></div>
        <div className="kpi"><div><div className="kpi__label">Total spent</div><div className="kpi__value">{formatPrice(spent)}</div></div></div>
        <div className="kpi"><div><div className="kpi__label">Average order</div><div className="kpi__value">{formatPrice(orders.length ? spent / orders.length : 0)}</div></div></div>
        <div className="kpi"><div><div className="kpi__label">Wishlist items</div><div className="kpi__value">{wish.n}</div></div></div>
      </div>
      <div className="admin-grid-2">
        <section className="panel">
          <div className="panel__head"><h3>Orders</h3></div>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Order</th><th>Total</th><th>Payment</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td><Link className="link" href={`/admin/orders/${o.id}`}>#{o.order_number}</Link></td>
                    <td>{formatPrice(o.total)}</td>
                    <td>{PAYMENT_LABELS[o.payment_method]}</td>
                    <td><StatusBadge value={o.status} /></td>
                    <td className="muted nowrap">{formatDate(o.created_at)}</td>
                  </tr>
                ))}
                {!orders.length && <tr><td colSpan={5} className="muted">No orders yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
        <section className="panel">
          <div className="panel__head"><h3>Addresses</h3></div>
          <div className="panel__body" style={{ display: 'grid', gap: 14, fontSize: 14 }}>
            {addresses.map((a) => (
              <div key={a.id}><b>{a.name}</b> {a.is_default ? <span className="status status--active">Default</span> : null}<br />{a.phone}<br />{a.address}, {a.city}, {a.province}</div>
            ))}
            {!addresses.length && <p className="muted">No saved addresses.</p>}
          </div>
        </section>
      </div>
    </>
  );
}
