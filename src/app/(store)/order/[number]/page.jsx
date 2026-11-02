import Link from 'next/link';
import { notFound } from 'next/navigation';
import Icon from '@/components/Icon';
import OrderDetails from '@/components/store/order/OrderDetails';
import PaymentActions from '@/components/store/order/PaymentActions';
import { getCustomer } from '@/lib/auth';
import { formatPrice, PAYMENT_LABELS } from '@/lib/format';
import { getOrder } from '@/lib/orders';
import { getSettings } from '@/lib/settings';

export const metadata = { title: 'Order Details', robots: { index: false } };

const PAYMENT_MESSAGES = {
  success: ['notice--green', 'check', 'Payment received. Thank you!'],
  submitted: ['notice--green', 'clock', 'Your payment was submitted and is being verified.'],
  failed: ['', 'alert', 'Payment was not completed. You can try again below or contact us on WhatsApp.'],
  unavailable: ['', 'alert', 'Online payment is temporarily unavailable. Please contact us to complete your order.'],
};

export default async function OrderPage({ params, searchParams }) {
  const { number } = await params;
  const sp = await searchParams;
  const [order, customer, settings] = await Promise.all([getOrder({ order_number: number }), getCustomer(), getSettings()]);
  const allowed = order && ((sp.t && sp.t === order.access_token) || (customer && order.customer_id === customer.id));
  if (!allowed) notFound();

  const token = sp.t === order.access_token ? sp.t : order.customer_id === customer?.id ? order.access_token : null;
  const msg = PAYMENT_MESSAGES[sp.payment];
  const plain = JSON.parse(JSON.stringify(order));

  return (
    <div className="container" style={{ paddingBottom: 48 }}>
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <Icon name="chevronRight" size={14} />
        {customer ? <Link href="/account/orders">My Orders</Link> : <Link href="/track-order">Track Order</Link>}
        <Icon name="chevronRight" size={14} />
        <span>#{order.order_number}</span>
      </nav>

      {sp.placed && (
        <div className="success-hero">
          <div className="success-hero__icon"><Icon name="check" size={40} strokeWidth={2.6} /></div>
          <h1 style={{ fontSize: 30 }}>Thank you for your order!</h1>
          <p style={{ color: 'var(--muted)', marginTop: 8 }}>
            Your order <b>#{order.order_number}</b> of <b>{formatPrice(order.total)}</b> has been placed ({PAYMENT_LABELS[order.payment_method]}).
            <br />
            We’ll call you on <b>{order.phone}</b> to confirm. Save this page link to track your order.
          </p>
        </div>
      )}
      {msg && (
        <p className={`notice ${msg[0]}`} style={{ marginBottom: 20 }}>
          <Icon name={msg[1]} /> {msg[2]}
        </p>
      )}

      <OrderDetails order={plain}>
        <PaymentActions order={plain} token={token} bank={settings.payments.bank_transfer} />
      </OrderDetails>

      <div style={{ display: 'flex', gap: 10, marginTop: 24, flexWrap: 'wrap' }}>
        <Link href="/shop" className="btn btn--primary">Continue Shopping</Link>
        {customer && <Link href="/account/orders" className="btn btn--outline">View all orders</Link>}
      </div>
    </div>
  );
}
