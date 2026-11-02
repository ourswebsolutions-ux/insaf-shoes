'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Icon from '@/components/Icon';
import { formatPrice } from '@/lib/format';
import { useShop } from '../ShopProvider';

export function CouponBox() {
  const { cart, applyCoupon, removeCoupon, toast } = useShop();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function apply() {
    if (!code.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await applyCoupon(code);
      setCode('');
      toast('Coupon applied.');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (cart?.coupon_code && !cart.coupon_error)
    return (
      <div className="coupon-applied">
        <span>
          <Icon name="tag" size={16} style={{ verticalAlign: '-3px', marginRight: 6 }} />
          <b>{cart.coupon_code}</b> applied
        </span>
        <button className="remove-btn" onClick={() => removeCoupon().catch((e) => toast(e.message, { type: 'error' }))}>
          Remove
        </button>
      </div>
    );

  return (
    <>
      <div className="coupon-form">
        <input
          className="input"
          placeholder="Coupon code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              apply();
            }
          }}
          aria-label="Coupon code"
        />
        <button type="button" className="btn btn--outline" disabled={busy || !code.trim()} onClick={apply}>
          Apply
        </button>
      </div>
      {(error || cart?.coupon_error) && <p className="field error" style={{ marginTop: -6, marginBottom: 10 }}>{error || cart.coupon_error}</p>}
    </>
  );
}

export function Totals({ cart, shippingLabel }) {
  return (
    <>
      <div className="summary-row">
        <span>Subtotal ({cart.count} items)</span>
        <span>{formatPrice(cart.subtotal)}</span>
      </div>
      {cart.discount > 0 && (
        <div className="summary-row">
          <span>Discount</span>
          <span className="green">− {formatPrice(cart.discount)}</span>
        </div>
      )}
      <div className="summary-row">
        <span>Delivery</span>
        <span className={cart.shipping === 0 ? 'green' : ''}>{shippingLabel || (cart.shipping === 0 ? 'FREE' : formatPrice(cart.shipping))}</span>
      </div>
      {cart.payment_fee > 0 && (
        <div className="summary-row">
          <span>COD charges</span>
          <span>{formatPrice(cart.payment_fee)}</span>
        </div>
      )}
      <div className="summary-row summary-row--total">
        <span>Total</span>
        <span>{formatPrice(cart.total)}</span>
      </div>
    </>
  );
}

export function FreeShippingProgress({ cart }) {
  if (!cart.free_shipping_threshold) return null;
  const pct = Math.min(100, ((cart.subtotal - cart.discount) / cart.free_shipping_threshold) * 100);
  return (
    <div className="ship-progress">
      {cart.free_shipping_remaining > 0 ? (
        <>
          Add <b>{formatPrice(cart.free_shipping_remaining)}</b> more for <b>FREE delivery</b>
        </>
      ) : (
        <>
          <Icon name="truck" size={16} style={{ verticalAlign: '-3px' }} /> You’ve unlocked <b>FREE delivery!</b>
        </>
      )}
      <div className="ship-progress__bar">
        <span style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Line({ line }) {
  const { updateLine, removeLine, toast } = useShop();
  const [busy, setBusy] = useState(false);
  const run = async (fn) => {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      toast(e.message, { type: 'error' });
    } finally {
      setBusy(false);
    }
  };
  const max = Math.max(1, Math.min(10, line.stock));
  return (
    <div className="cart-line" style={{ opacity: busy ? 0.6 : 1 }}>
      <Link href={`/product/${line.slug}`} className="cart-line__img">
        {line.image && <Image src={line.image} alt={line.name} fill sizes="96px" />}
      </Link>
      <div>
        <Link href={`/product/${line.slug}`} className="cart-line__name">{line.name}</Link>
        <p className="cart-line__opts">
          {[line.size && `Size: ${line.size}`, line.color && `Colour: ${line.color}`].filter(Boolean).join(' · ')}
          {line.unit_price < line.regular_price && <> · <s>{formatPrice(line.regular_price)}</s></>} {formatPrice(line.unit_price)} each
        </p>
        {line.issue && <p className="cart-line__issue">{line.issue}</p>}
        <div className="cart-line__controls">
          <div className="qty qty--sm">
            <button onClick={() => run(() => updateLine(line.id, line.quantity - 1))} disabled={busy || line.quantity <= 1} aria-label="Decrease quantity">
              <Icon name="minus" size={14} />
            </button>
            <input value={line.quantity} readOnly aria-label="Quantity" />
            <button onClick={() => run(() => updateLine(line.id, line.quantity + 1))} disabled={busy || line.quantity >= max} aria-label="Increase quantity">
              <Icon name="plus" size={14} />
            </button>
          </div>
          <button className="remove-btn" onClick={() => run(() => removeLine(line.id))} disabled={busy}>
            <Icon name="trash" size={15} /> Remove
          </button>
        </div>
      </div>
      <div className="cart-line__total">
        <span className="price__now">{formatPrice(line.line_total)}</span>
      </div>
    </div>
  );
}

export default function CartView() {
  const { cart } = useShop();

  if (!cart)
    return (
      <div className="cart-layout">
        <div className="panel skeleton" style={{ height: 320 }} />
        <div className="panel skeleton" style={{ height: 320 }} />
      </div>
    );

  if (!cart.lines.length)
    return (
      <div className="empty">
        <Icon name="cart" size={52} />
        <h2>Your cart is empty</h2>
        <p>Looks like you haven’t added anything yet.</p>
        <Link href="/shop" className="btn btn--primary">
          Start Shopping <Icon name="arrowRight" size={18} className="arrow" />
        </Link>
      </div>
    );

  return (
    <div className="cart-layout">
      <div className="panel">
        <div className="panel__head">
          <h2>Shopping Cart</h2>
          <span style={{ color: 'var(--muted)', fontSize: 14 }}>{cart.count} items</span>
        </div>
        {cart.lines.map((l) => (
          <Line key={l.id} line={l} />
        ))}
      </div>
      <aside className="panel" style={{ position: 'sticky', top: 'calc(var(--header-h) + 16px)' }}>
        <div className="panel__head">
          <h3>Order Summary</h3>
        </div>
        <div className="panel__body">
          <FreeShippingProgress cart={cart} />
          <CouponBox />
          <Totals cart={cart} shippingLabel={cart.shipping === 0 ? 'FREE' : `${formatPrice(cart.shipping)}*`} />
          {cart.shipping > 0 && <p style={{ fontSize: 12, color: 'var(--muted)' }}>*Final delivery charge is confirmed at checkout based on your city.</p>}
          {cart.has_issues && (
            <p className="form-error" style={{ marginTop: 12 }}>
              Some items need attention before checkout.
            </p>
          )}
          {cart.has_issues ? (
            <button className="btn btn--primary btn--block btn--lg" style={{ marginTop: 16 }} disabled>
              Proceed to Checkout
            </button>
          ) : (
            <Link href="/checkout" className="btn btn--primary btn--block btn--lg" style={{ marginTop: 16 }}>
              Proceed to Checkout <Icon name="arrowRight" size={18} className="arrow" />
            </Link>
          )}
          <Link href="/shop" className="btn btn--ghost btn--block" style={{ marginTop: 10 }}>
            Continue Shopping
          </Link>
        </div>
      </aside>
    </div>
  );
}
