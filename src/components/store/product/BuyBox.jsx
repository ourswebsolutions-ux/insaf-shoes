'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/Icon';
import { useShop } from '../ShopProvider';
import VariantOptions, { useVariantSelection } from '../VariantOptions';
import PriceTag from '../PriceTag';

export default function BuyBox({ product, lowStockThreshold = 5 }) {
  const router = useRouter();
  const { addToCart, toast, wishlist, toggleWishlist } = useShop();
  const sel = useVariantSelection(product.variants);
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);

  const extra = Number(sel.variant?.price_adjustment || 0);
  const stock = sel.variant ? sel.variant.stock : sel.totalStock;
  const maxQty = Math.max(1, Math.min(10, sel.variant?.stock || 10));
  const wished = wishlist.has(product.id);

  async function submit(buyNow) {
    setError(null);
    if (sel.missing) return setError(sel.missing);
    if (!sel.variant || sel.variant.stock <= 0) return setError('This option is out of stock. Please choose another.');
    if (qty > sel.variant.stock) return setError(`Only ${sel.variant.stock} left in stock.`);
    setBusy(buyNow ? 'buy' : 'add');
    try {
      await addToCart(product.id, sel.variant.id, qty, { silent: buyNow });
      if (buyNow) router.push('/checkout');
    } catch (e) {
      setError(e.message);
      toast(e.message, { type: 'error' });
    } finally {
      setBusy(null);
    }
  }

  let stockEl;
  if (sel.totalStock <= 0) stockEl = <span className="stock stock--out"><Icon name="x" size={16} /> Out of stock</span>;
  else if (sel.variant && sel.variant.stock <= 0) stockEl = <span className="stock stock--out"><Icon name="x" size={16} /> This option is out of stock</span>;
  else if (sel.variant && sel.variant.stock <= lowStockThreshold) stockEl = <span className="stock stock--low"><Icon name="clock" size={16} /> Hurry, only {sel.variant.stock} left</span>;
  else stockEl = <span className="stock stock--in"><Icon name="check" size={16} /> In stock</span>;

  return (
    <div>
      <div className="buybox__price">
        <PriceTag price={Number(product.price) + extra} sale={product.sale_price ? Number(product.sale_price) + extra : null} showSave className="price" />
      </div>
      <div style={{ marginTop: 10 }}>{stockEl}</div>
      <VariantOptions sel={sel} />
      {error && <p className="form-error" style={{ marginTop: 16 }} role="alert">{error}</p>}
      <div className="buybox__actions">
        <div className="qty" aria-label="Quantity">
          <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="Decrease quantity">
            <Icon name="minus" size={16} />
          </button>
          <input type="number" value={qty} min={1} max={maxQty} onChange={(e) => setQty(Math.max(1, Math.min(maxQty, Number(e.target.value) || 1)))} aria-label="Quantity" />
          <button type="button" onClick={() => setQty((q) => Math.min(maxQty, q + 1))} disabled={qty >= maxQty} aria-label="Increase quantity">
            <Icon name="plus" size={16} />
          </button>
        </div>
        <button className="btn btn--primary" onClick={() => submit(false)} disabled={!!busy || stock <= 0}>
          {busy === 'add' ? <span className="spinner" /> : <Icon name="cart" size={18} />} Add to Cart
        </button>
        <button className="btn btn--bright btn--buy" onClick={() => submit(true)} disabled={!!busy || stock <= 0}>
          {busy === 'buy' ? <span className="spinner" /> : null} Buy Now
        </button>
        <button type="button" className={`icon-btn wish-lg ${wished ? 'is-on' : ''}`} style={{ width: 48, height: 48, color: wished ? 'var(--red)' : undefined }} onClick={() => toggleWishlist(product.id)} aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'} aria-pressed={wished}>
          <Icon name={wished ? 'heartFill' : 'heart'} />
        </button>
      </div>
    </div>
  );
}
