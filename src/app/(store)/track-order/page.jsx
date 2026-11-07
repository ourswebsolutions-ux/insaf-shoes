import Link from 'next/link';
import Icon from '@/components/Icon';
import { OrderProgress, StatusBadge } from '@/components/store/order/OrderDetails';
import { queryOne } from '@/lib/db';
import { formatDate, formatPrice } from '@/lib/format';
import { normalizePkPhone } from '@/lib/pakistan';

export const metadata = { title: 'Track Your Order', description: 'Track your Insaf Shoes order status using your order number and phone number.' };

export default async function TrackOrderPage({ searchParams }) {
  const sp = await searchParams;
  const number = String(sp.order || '').trim().toUpperCase();
  const phone = normalizePkPhone(sp.phone);
  let order = null;
  let error = null;
  if (sp.order || sp.phone) {
    if (!number || !phone) error = 'Please enter your order number and the mobile number used at checkout.';
    else {
      order = await queryOne('SELECT order_number, access_token, status, payment_status, total, created_at, courier, tracking_number, city FROM orders WHERE order_number = ? AND phone = ?', [number, phone]);
      if (!order) error = 'We couldn’t find an order with those details. Please check and try again.';
    }
  }
  if (sp.payment === 'failed' && !order) error = 'Payment could not be verified. If money was deducted, please contact us with your order number.';

  return (
    <>
      <section className="page-head">
        <div className="container page-head__inner">
          <h1>Track Your Order</h1>
          <p>Enter your order number and the mobile number you used at checkout.</p>
        </div>
      </section>
      <div className="container content-page" style={{ maxWidth: 760 }}>
        <form className="panel panel__body form-grid" method="get">
          <div className="field">
            <label htmlFor="tr-order">Order number</label>
            <input id="tr-order" name="order" className="input" placeholder="e.g. PS26110112345" defaultValue={sp.order || ''} required />
          </div>
          <div className="field">
            <label htmlFor="tr-phone">Mobile number</label>
            <input id="tr-phone" name="phone" className="input" type="tel" placeholder="03XX XXXXXXX" defaultValue={sp.phone || ''} required />
          </div>
          <div className="span-2">
            <button className="btn btn--primary"><Icon name="search" size={18} /> Track Order</button>
          </div>
        </form>

        {error && <p className="form-error" style={{ marginTop: 20 }}>{error}</p>}

        {order && (
          <section className="panel" style={{ marginTop: 20 }}>
            <div className="panel__head">
              <div>
                <h2>Order #{order.order_number}</h2>
                <small style={{ color: 'var(--muted)' }}>Placed {formatDate(order.created_at)} · {formatPrice(order.total)} · {order.city}</small>
              </div>
              <StatusBadge value={order.status} />
            </div>
            <div className="panel__body">
              <OrderProgress status={order.status} />
              {order.tracking_number && (
                <p className="notice notice--green" style={{ marginTop: 16 }}>
                  <Icon name="truck" /> <span>{order.courier || 'Courier'} tracking number: <b>{order.tracking_number}</b></span>
                </p>
              )}
              <Link href={`/order/${order.order_number}?t=${order.access_token}`} className="btn btn--outline" style={{ marginTop: 18 }}>
                View full order details
              </Link>
            </div>
          </section>
        )}
      </div>
    </>
  );
}
