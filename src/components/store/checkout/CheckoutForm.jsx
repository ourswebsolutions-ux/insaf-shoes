'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Icon from '@/components/Icon';
import { formatPrice } from '@/lib/format';
import { CITIES, PROVINCES, normalizePkPhone } from '@/lib/pakistan';
import { api, useShop } from '../ShopProvider';
import { CouponBox } from '../cart/CartView';

const PAY_ICONS = { cod: 'cash', jazzcash: 'wallet', easypaisa: 'wallet', bank_transfer: 'bank' };

export default function CheckoutForm({ methods, shipping, addresses, customer }) {
  const router = useRouter();
  const { cart, refreshCart } = useShop();
  const def = addresses.find((a) => a.is_default) || addresses[0];
  const [form, setForm] = useState({
    name: def?.name || customer?.name || '',
    phone: def?.phone || customer?.phone || '',
    email: customer?.email || '',
    address: def?.address || '',
    province: def?.province || 'Punjab',
    city: def?.city || '',
    postal_code: def?.postal_code || '',
    notes: '',
    payment_method: methods[0]?.id || '',
    save_address: !!customer && !addresses.length,
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [otherCity, setOtherCity] = useState(() => !!def?.city && !(CITIES[def.province] || []).includes(def.city));

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const set = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((er) => ({ ...er, [k]: undefined }));
  };

  // Preview of the delivery charge; the server recalculates on submit.
  const totals = useMemo(() => {
    if (!cart) return null;
    const base = cart.subtotal - cart.discount;
    let fee = Number(shipping.free_threshold) > 0 && base >= Number(shipping.free_threshold) ? 0 : Number(shipping.city_fees?.[form.city] ?? shipping.flat_fee) || 0;
    const cod = form.payment_method === 'cod' ? Number(shipping.cod_fee) || 0 : 0;
    return { ...cart, shipping: fee, payment_fee: cod, total: base + fee + cod };
  }, [cart, form.city, form.payment_method, shipping]);

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    if (!normalizePkPhone(form.phone)) e.phone = 'Enter a valid mobile number, e.g. 03001234567';
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email';
    if (form.address.trim().length < 10) e.address = 'Please enter your complete address (house, street, area)';
    if (!form.city.trim()) e.city = 'City is required';
    if (form.postal_code && !/^\d{5}$/.test(form.postal_code)) e.postal_code = 'Postal code must be 5 digits';
    if (!form.payment_method) e.payment_method = 'Select a payment method';
    setErrors(e);
    return !Object.keys(e).length;
  }

  async function submit(e) {
    e.preventDefault();
    setFormError(null);
    if (!validate()) {
      document.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }
    setBusy(true);
    try {
      const res = await api('/api/checkout', { method: 'POST', body: form });
      await refreshCart();
      if (res.redirect.startsWith('/api/')) window.location.href = res.redirect;
      else router.push(res.redirect);
    } catch (err) {
      setFormError(err.message);
      if (err.details) setErrors(err.details);
      setBusy(false);
      refreshCart();
    }
  }

  if (!cart) return <div className="panel skeleton" style={{ height: 400, margin: '20px 0' }} />;
  if (!cart.lines.length)
    return (
      <div className="empty">
        <Icon name="cart" size={52} />
        <h2>Your cart is empty</h2>
        <p>Add some products before checking out.</p>
        <Link href="/shop" className="btn btn--primary">Browse Products</Link>
      </div>
    );

  const err = (k) => errors[k] && <span className="error">{errors[k]}</span>;
  const cityList = CITIES[form.province] || [];

  return (
    <form className="cart-layout" onSubmit={submit} noValidate>
      <div style={{ display: 'grid', gap: 20 }}>
        {!customer && (
          <div className="notice notice--green">
            <Icon name="user" />
            <span>
              Have an account? <Link href="/login?next=/checkout" className="link">Log in</Link> for faster checkout and order tracking. You can also continue as a guest.
            </span>
          </div>
        )}
        <section className="panel">
          <div className="panel__head"><h2>Delivery Information</h2></div>
          <div className="panel__body">
            {addresses.length > 0 && (
              <div className="saved-addresses">
                <span className="label">Saved addresses</span>
                {addresses.map((a) => (
                  <label key={a.id} className="pay-option" style={{ padding: '10px 14px' }}>
                    <input
                      type="radio"
                      name="saved"
                      defaultChecked={a.id === def?.id}
                      onChange={() => {
                        setForm((f) => ({ ...f, name: a.name, phone: a.phone, address: a.address, city: a.city, province: a.province, postal_code: a.postal_code || '' }));
                        setOtherCity(!(CITIES[a.province] || []).includes(a.city));
                      }}
                    />
                    <span style={{ fontSize: 14 }}>
                      <b style={{ display: 'inline' }}>{a.name}</b> · {a.phone}
                      <br />
                      <small>{a.address}, {a.city}, {a.province}</small>
                    </span>
                  </label>
                ))}
              </div>
            )}
            <div className="form-grid">
              <div className="field">
                <label htmlFor="co-name">Full name *</label>
                <input id="co-name" className="input" autoComplete="name" value={form.name} onChange={set('name')} aria-invalid={!!errors.name} />
                {err('name')}
              </div>
              <div className="field">
                <label htmlFor="co-phone">Mobile number *</label>
                <input id="co-phone" className="input" type="tel" inputMode="tel" autoComplete="tel" placeholder="03XX XXXXXXX" value={form.phone} onChange={set('phone')} aria-invalid={!!errors.phone} />
                {err('phone') || <span className="hint">We’ll call to confirm your order.</span>}
              </div>
              <div className="field span-2">
                <label htmlFor="co-email">Email (optional)</label>
                <input id="co-email" className="input" type="email" autoComplete="email" value={form.email} onChange={set('email')} aria-invalid={!!errors.email} />
                {err('email')}
              </div>
              <div className="field span-2">
                <label htmlFor="co-address">Complete address *</label>
                <textarea id="co-address" className="textarea" style={{ minHeight: 80 }} autoComplete="street-address" placeholder="House #, Street, Block/Sector, Area, Nearby landmark" value={form.address} onChange={set('address')} aria-invalid={!!errors.address} />
                {err('address')}
              </div>
              <div className="field">
                <label htmlFor="co-province">Province *</label>
                <select
                  id="co-province"
                  className="select"
                  value={form.province}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, province: e.target.value, city: '' }));
                    setOtherCity(false);
                  }}
                >
                  {PROVINCES.map((p) => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="co-city">City *</label>
                {otherCity ? (
                  <input id="co-city" className="input" autoComplete="address-level2" value={form.city} onChange={set('city')} aria-invalid={!!errors.city} placeholder="Enter your city" />
                ) : (
                  <select
                    id="co-city"
                    className="select"
                    value={form.city}
                    aria-invalid={!!errors.city}
                    onChange={(e) => {
                      if (e.target.value === '__other') {
                        setOtherCity(true);
                        setForm((f) => ({ ...f, city: '' }));
                      } else set('city')(e);
                    }}
                  >
                    <option value="">Select city</option>
                    {cityList.map((c) => <option key={c}>{c}</option>)}
                    <option value="__other">Other city…</option>
                  </select>
                )}
                {err('city')}
              </div>
              <div className="field">
                <label htmlFor="co-postal">Postal code (optional)</label>
                <input id="co-postal" className="input" inputMode="numeric" maxLength={5} value={form.postal_code} onChange={set('postal_code')} aria-invalid={!!errors.postal_code} />
                {err('postal_code')}
              </div>
              <div className="field span-2">
                <label htmlFor="co-notes">Order notes (optional)</label>
                <textarea id="co-notes" className="textarea" style={{ minHeight: 70 }} placeholder="Delivery instructions, preferred time, etc." maxLength={1000} value={form.notes} onChange={set('notes')} />
              </div>
              {customer && (
                <label className="checkbox span-2">
                  <input type="checkbox" checked={form.save_address} onChange={set('save_address')} /> Save this address to my account
                </label>
              )}
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel__head"><h2>Payment Method</h2></div>
          <div className="panel__body">
            {methods.length === 0 && <p className="form-error">No payment methods are currently available. Please contact us.</p>}
            <div className="pay-options" role="radiogroup">
              {methods.map((m) => (
                <label key={m.id} className={`pay-option ${form.payment_method === m.id ? 'is-active' : ''}`}>
                  <input type="radio" name="payment_method" value={m.id} checked={form.payment_method === m.id} onChange={set('payment_method')} />
                  <span>
                    <b>{m.label}</b>
                    <small>{m.description}</small>
                  </span>
                  <Icon name={PAY_ICONS[m.id]} size={26} className="pay-option__icon" />
                </label>
              ))}
            </div>
            {err('payment_method')}
            {(form.payment_method === 'jazzcash' || form.payment_method === 'easypaisa') && (
              <p className="hint" style={{ marginTop: 10, fontSize: 13, color: 'var(--muted)' }}>
                You’ll be redirected to {form.payment_method === 'jazzcash' ? 'JazzCash' : 'Easypaisa'} to complete payment securely. Your order is confirmed once payment is verified.
              </p>
            )}
            {form.payment_method === 'bank_transfer' && (
              <p className="hint" style={{ marginTop: 10, fontSize: 13, color: 'var(--muted)' }}>
                Bank details will be shown after you place the order. Submit your transaction ID so we can verify the payment.
              </p>
            )}
          </div>
        </section>
      </div>

      <aside className="panel" style={{ position: 'sticky', top: 'calc(var(--header-h) + 16px)' }}>
        <div className="panel__head">
          <h3>Your Order</h3>
          <Link href="/cart" className="link" style={{ fontSize: 14 }}>Edit cart</Link>
        </div>
        <div className="panel__body">
          <div className="mini-lines">
            {cart.lines.map((l) => (
              <div className="mini-line" key={l.id}>
                <div className="mini-line__img" style={{ overflow: 'visible' }}>
                  <div style={{ position: 'absolute', inset: 0, borderRadius: 6, overflow: 'hidden' }}>
                    {l.image && <Image src={l.image} alt="" fill sizes="56px" />}
                  </div>
                  <span className="mini-line__qty">{l.quantity}</span>
                </div>
                <div>
                  <b style={{ fontWeight: 600 }}>{l.name}</b>
                  <div style={{ color: 'var(--muted)', fontSize: 12.5 }}>{[l.size && `Size ${l.size}`, l.color].filter(Boolean).join(' · ')}</div>
                  {l.issue && <div className="cart-line__issue">{l.issue}</div>}
                </div>
                <span style={{ fontWeight: 600 }}>{formatPrice(l.line_total)}</span>
              </div>
            ))}
          </div>
          <CouponBox />
          <Totals cart={totals} />
          {formError && <p className="form-error" style={{ marginTop: 14 }} role="alert">{formError}</p>}
          <button className="btn btn--primary btn--block btn--lg" style={{ marginTop: 18 }} disabled={busy || cart.has_issues || !methods.length}>
            {busy ? <><span className="spinner" /> Placing order…</> : <><Icon name="lock" size={18} /> Place Order · {formatPrice(totals.total)}</>}
          </button>
          <p style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 10, textAlign: 'center' }}>
            By placing your order you agree to our <Link href="/terms" className="link">Terms</Link> and <Link href="/return-policy" className="link">Return Policy</Link>.
          </p>
        </div>
      </aside>
    </form>
  );
}

function Totals({ cart }) {
  return (
    <>
      <div className="summary-row"><span>Subtotal</span><span>{formatPrice(cart.subtotal)}</span></div>
      {cart.discount > 0 && <div className="summary-row"><span>Discount ({cart.coupon_code})</span><span className="green">− {formatPrice(cart.discount)}</span></div>}
      <div className="summary-row"><span>Delivery</span><span className={cart.shipping === 0 ? 'green' : ''}>{cart.shipping === 0 ? 'FREE' : formatPrice(cart.shipping)}</span></div>
      {cart.payment_fee > 0 && <div className="summary-row"><span>COD charges</span><span>{formatPrice(cart.payment_fee)}</span></div>}
      <div className="summary-row summary-row--total"><span>Total</span><span>{formatPrice(cart.total)}</span></div>
    </>
  );
}
