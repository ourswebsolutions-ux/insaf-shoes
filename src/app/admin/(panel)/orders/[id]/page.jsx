import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Icon from '@/components/Icon';
import OrderControls from '@/components/admin/OrderControls';
import { HistoryTimeline, OrderProgress, StatusBadge } from '@/components/store/order/OrderDetails';
import { pageAdmin } from '@/lib/admin';
import { queryOne } from '@/lib/db';
import { formatDate, formatPrice, PAYMENT_LABELS } from '@/lib/format';
import { getOrder } from '@/lib/orders';
import { whatsappLink } from '@/lib/pakistan';

export const metadata = { title: 'Order Details' };

export default async function AdminOrderPage({ params }) {
  await pageAdmin('orders');
  const { id } = await params;
  const order = await getOrder({ id: Number(id) || 0 });
  if (!order) notFound();
  const customer = order.customer_id ? await queryOne('SELECT id, name, email, (SELECT COUNT(*) FROM orders WHERE customer_id = c.id) AS orders FROM customers c WHERE id = ?', [order.customer_id]) : null;
  const plain = JSON.parse(JSON.stringify(order));
  const pay = order.payments[0];

  return (
    <>
      <div className="page-bar">
        <div>
          <Link href="/admin/orders" className="link" style={{ fontSize: 13 }}>← All orders</Link>
          <h1 style={{ marginTop: 4 }}>Order #{order.order_number}</h1>
          <p>Placed {formatDate(order.created_at, true)} · <StatusBadge value={order.status} /> <StatusBadge value={order.payment_status} /></p>
        </div>
        <div className="page-bar__actions">
          <a className="btn btn--outline btn--sm" href={whatsappLink(order.phone, `Assalam o Alaikum ${order.name}, regarding your PunjabShop order #${order.order_number}`)} target="_blank" rel="noopener noreferrer"><Icon name="whatsapp" size={16} /> WhatsApp customer</a>
          <a className="btn btn--outline btn--sm" href={`/order/${order.order_number}?t=${order.access_token}`} target="_blank"><Icon name="eye" size={16} /> Customer view</a>
        </div>
      </div>

      <div className="form-layout" style={{ gridTemplateColumns: 'minmax(0,1fr) 360px' }}>
        <div style={{ display: 'grid', gap: 20 }}>
          <section className="panel"><div className="panel__body"><OrderProgress status={order.status} /></div></section>
          <section className="panel">
            <div className="panel__head"><h3>Items ({order.items.reduce((s, i) => s + i.quantity, 0)})</h3></div>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Product</th><th>Variant</th><th>Price</th><th>Qty</th><th className="text-right">Total</th></tr></thead>
                <tbody>
                  {order.items.map((it) => (
                    <tr key={it.id}>
                      <td>
                        <div className="cell-product">
                          <span className="thumb">{it.image && <Image src={it.image} alt="" fill sizes="48px" />}</span>
                          <span>{it.product_id ? <Link href={`/admin/products/${it.product_id}`}><b>{it.product_name}</b></Link> : <b>{it.product_name}</b>}<small>{it.sku}</small></span>
                        </div>
                      </td>
                      <td>{[it.size && `Size ${it.size}`, it.color].filter(Boolean).join(' · ') || '—'}</td>
                      <td className="nowrap">{formatPrice(it.unit_price)}</td>
                      <td>{it.quantity}</td>
                      <td className="text-right nowrap"><b>{formatPrice(it.line_total)}</b></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="panel__body" style={{ borderTop: '1px solid var(--line-2)', maxWidth: 380, marginLeft: 'auto' }}>
              <div className="summary-row"><span>Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
              {order.discount > 0 && <div className="summary-row"><span>Discount ({order.coupon_code})</span><span className="green">− {formatPrice(order.discount)}</span></div>}
              <div className="summary-row"><span>Delivery</span><span>{formatPrice(order.shipping_fee)}</span></div>
              {order.payment_fee > 0 && <div className="summary-row"><span>COD charges</span><span>{formatPrice(order.payment_fee)}</span></div>}
              <div className="summary-row summary-row--total"><span>Total</span><span>{formatPrice(order.total)}</span></div>
            </div>
          </section>
          <div className="form-grid" style={{ gap: 20 }}>
            <section className="panel">
              <div className="panel__head"><h3>Customer &amp; Delivery</h3></div>
              <div className="panel__body" style={{ fontSize: 14.5, lineHeight: 1.7 }}>
                <b>{order.name}</b><br />
                <a href={`tel:${order.phone}`} className="link">{order.phone}</a>
                {order.email && <><br />{order.email}</>}
                <br />{order.address}<br />{order.city}, {order.province} {order.postal_code}
                {order.notes && <p className="notice" style={{ marginTop: 10 }}><Icon name="message" /> {order.notes}</p>}
                <p style={{ marginTop: 10 }}>
                  {customer ? <Link className="link" href={`/admin/customers/${customer.id}`}>Registered customer · {customer.orders} orders</Link> : <span className="muted">Guest checkout</span>}
                </p>
              </div>
            </section>
            <section className="panel">
              <div className="panel__head"><h3>Payment Details</h3></div>
              <div className="panel__body">
                <dl className="kv">
                  <dt>Method</dt><dd>{PAYMENT_LABELS[order.payment_method]}</dd>
                  <dt>Status</dt><dd><StatusBadge value={order.payment_status} /></dd>
                  <dt>Amount</dt><dd>{formatPrice(pay?.amount ?? order.total)}</dd>
                  {pay?.gateway_ref && (<><dt>Gateway ref</dt><dd>{pay.gateway_ref}</dd></>)}
                  {pay?.transaction_ref && (<><dt>Transaction ID</dt><dd>{pay.transaction_ref}</dd></>)}
                  {pay?.payer_account && (<><dt>Paid from</dt><dd>{pay.payer_account}</dd></>)}
                  {pay?.verified_at && (<><dt>Verified</dt><dd>{formatDate(pay.verified_at, true)}</dd></>)}
                </dl>
              </div>
            </section>
          </div>
          <section className="panel">
            <div className="panel__head"><h3>History</h3></div>
            <div className="panel__body"><HistoryTimeline history={plain.history} /></div>
          </section>
        </div>
        <aside><OrderControls order={plain} /></aside>
      </div>
    </>
  );
}
