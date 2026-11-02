import Link from 'next/link';
import Icon from '@/components/Icon';
import OrdersTable from '@/components/store/account/OrdersTable';
import { getCustomer } from '@/lib/auth';
import { query } from '@/lib/db';

export const metadata = { title: 'My Orders', robots: { index: false } };

export default async function MyOrdersPage() {
  const customer = await getCustomer();
  const orders = await query(
    'SELECT o.*, (SELECT SUM(quantity) FROM order_items WHERE order_id = o.id) AS item_count FROM orders o WHERE customer_id = ? ORDER BY created_at DESC',
    [customer.id]
  );
  return (
    <section className="panel">
      <div className="panel__head"><h2>My Orders</h2></div>
      {orders.length ? (
        <OrdersTable orders={orders} />
      ) : (
        <div className="empty">
          <Icon name="package" size={44} />
          <h3>No orders yet</h3>
          <p>When you place an order, it will appear here.</p>
          <Link href="/shop" className="btn btn--primary">Shop now</Link>
        </div>
      )}
    </section>
  );
}
