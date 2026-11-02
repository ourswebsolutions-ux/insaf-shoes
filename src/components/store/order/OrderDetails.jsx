import Image from 'next/image';
import Link from 'next/link';
import Icon from '@/components/Icon';
import { formatDate, formatPrice, humanize, PAYMENT_LABELS } from '@/lib/format';

const STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
const STEP_LABELS = { pending: 'Placed', confirmed: 'Confirmed', processing: 'Processing', shipped: 'Shipped', delivered: 'Delivered' };
const STEP_ICONS = { pending: 'check', confirmed: 'check', processing: 'package', shipped: 'truck', delivered: 'home' };

export function StatusBadge({ value }) {
  return <span className={`status status--${value}`}>{humanize(value)}</span>;
}

export function OrderProgress({ status }) {
  if (['cancelled', 'returned'].includes(status))
    return (
      <div className="notice" style={{ background: '#fdecea', borderColor: '#f6cfcb' }}>
        <Icon name="alert" style={{ color: 'var(--red)' }} /> This order was {status}.
      </div>
    );
  const idx = STEPS.indexOf(status);
  return (
    <div className="progress-steps" role="list" aria-label="Order progress">
      {STEPS.map((s, i) => (
        <div key={s} role="listitem" className={`progress-step ${i <= idx ? 'is-done' : ''}`} aria-current={i === idx ? 'step' : undefined}>
          <i><Icon name={STEP_ICONS[s]} size={15} /></i>
          {STEP_LABELS[s]}
        </div>
      ))}
    </div>
  );
}

export function HistoryTimeline({ history }) {
  return (
    <div className="timeline">
      {[...history].reverse().map((h, i) => (
        <div key={i} className={`timeline__step is-done ${i === 0 ? 'is-current' : ''}`}>
          <span className="timeline__dot"><Icon name={h.status.startsWith('payment') ? 'card' : 'check'} size={15} /></span>
          <div>
            <b>{humanize(h.status.replace(/^payment_/, 'payment: '))}</b>
            <small>{formatDate(h.created_at, true)}{h.note ? ` · ${h.note}` : ''}</small>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function OrderDetails({ order, children }) {
  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <section className="panel">
        <div className="panel__head">
          <div>
            <h2>Order #{order.order_number}</h2>
            <small style={{ color: 'var(--muted)' }}>Placed on {formatDate(order.created_at, true)}</small>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <StatusBadge value={order.status} />
            <StatusBadge value={order.payment_status} />
          </div>
        </div>
        <div className="panel__body">
          <OrderProgress status={order.status} />
          {order.tracking_number && (
            <p className="notice notice--green" style={{ marginTop: 16 }}>
              <Icon name="truck" />
              <span>
                Shipped via <b>{order.courier || 'courier'}</b> · Tracking number: <b>{order.tracking_number}</b>
              </span>
            </p>
          )}
        </div>
      </section>

      {children}

      <section className="panel">
        <div className="panel__head"><h3>Items</h3></div>
        {order.items.map((it) => (
          <div className="cart-line" key={it.id}>
            <div className="cart-line__img">{it.image && <Image src={it.image} alt={it.product_name} fill sizes="96px" />}</div>
            <div>
              {it.slug ? <Link href={`/product/${it.slug}`} className="cart-line__name">{it.product_name}</Link> : <span className="cart-line__name">{it.product_name}</span>}
              <p className="cart-line__opts">
                {[it.size && `Size: ${it.size}`, it.color && `Colour: ${it.color}`, `Qty: ${it.quantity}`, `${formatPrice(it.unit_price)} each`].filter(Boolean).join(' · ')}
              </p>
            </div>
            <div className="cart-line__total"><span className="price__now">{formatPrice(it.line_total)}</span></div>
          </div>
        ))}
        <div className="panel__body" style={{ borderTop: '1px solid var(--line-2)' }}>
          <div className="summary-row"><span>Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
          {order.discount > 0 && <div className="summary-row"><span>Discount {order.coupon_code && `(${order.coupon_code})`}</span><span className="green">− {formatPrice(order.discount)}</span></div>}
          <div className="summary-row"><span>Delivery</span><span>{order.shipping_fee > 0 ? formatPrice(order.shipping_fee) : 'FREE'}</span></div>
          {order.payment_fee > 0 && <div className="summary-row"><span>COD charges</span><span>{formatPrice(order.payment_fee)}</span></div>}
          <div className="summary-row summary-row--total"><span>Total</span><span>{formatPrice(order.total)}</span></div>
        </div>
      </section>

      <div className="form-grid" style={{ gap: 20 }}>
        <section className="panel">
          <div className="panel__head"><h3>Delivery Address</h3></div>
          <div className="panel__body" style={{ fontSize: 14.5, lineHeight: 1.7 }}>
            <b>{order.name}</b>
            <br />
            {order.phone}
            {order.email && <><br />{order.email}</>}
            <br />
            {order.address}
            <br />
            {order.city}, {order.province} {order.postal_code}
            {order.notes && <p style={{ marginTop: 8, color: 'var(--muted)' }}>Note: {order.notes}</p>}
          </div>
        </section>
        <section className="panel">
          <div className="panel__head"><h3>Payment</h3></div>
          <div className="panel__body">
            <dl className="kv">
              <dt>Method</dt><dd>{PAYMENT_LABELS[order.payment_method]}</dd>
              <dt>Status</dt><dd><StatusBadge value={order.payment_status} /></dd>
              {order.payments[0]?.transaction_ref && (<><dt>Reference</dt><dd>{order.payments[0].transaction_ref}</dd></>)}
            </dl>
          </div>
        </section>
      </div>

      <section className="panel">
        <div className="panel__head"><h3>Order History</h3></div>
        <div className="panel__body"><HistoryTimeline history={order.history} /></div>
      </section>
    </div>
  );
}
