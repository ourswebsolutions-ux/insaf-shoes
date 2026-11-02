import Link from 'next/link';
import Icon from '@/components/Icon';
import OrdersTable from '@/components/store/account/OrdersTable';
import { PasswordForm, ProfileForm } from '@/components/store/account/ProfileForms';
import { getCustomer } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { formatPrice } from '@/lib/format';

export default async function AccountPage() {
  const customer = await getCustomer();
  const [stats, orders, wish] = await Promise.all([
    queryOne("SELECT COUNT(*) AS n, COALESCE(SUM(CASE WHEN status NOT IN ('cancelled','returned') THEN total END), 0) AS spent FROM orders WHERE customer_id = ?", [customer.id]),
    query('SELECT o.*, (SELECT SUM(quantity) FROM order_items WHERE order_id = o.id) AS item_count FROM orders o WHERE customer_id = ? ORDER BY created_at DESC LIMIT 5', [customer.id]),
    queryOne('SELECT COUNT(*) AS n FROM wishlist WHERE customer_id = ?', [customer.id]),
  ]);
  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <h1 style={{ fontSize: 26 }}>Assalam o Alaikum, {customer.name.split(' ')[0]}!</h1>
      <div className="stat-cards">
        <div className="stat-card"><b>{stats.n}</b><span>Orders placed</span></div>
        <div className="stat-card"><b>{formatPrice(stats.spent)}</b><span>Total spent</span></div>
        <div className="stat-card"><b>{wish.n}</b><span>Wishlist items</span></div>
      </div>
      <section className="panel">
        <div className="panel__head">
          <h3>Recent Orders</h3>
          <Link href="/account/orders" className="link" style={{ fontSize: 14 }}>View all</Link>
        </div>
        {orders.length ? (
          <OrdersTable orders={orders} />
        ) : (
          <div className="empty" style={{ padding: 32 }}>
            <Icon name="package" size={40} />
            <p>You haven’t placed any orders yet.</p>
            <Link href="/shop" className="btn btn--primary btn--sm">Start shopping</Link>
          </div>
        )}
      </section>
      <ProfileForm customer={{ name: customer.name, email: customer.email, phone: customer.phone }} />
      <PasswordForm />
    </div>
  );
}
