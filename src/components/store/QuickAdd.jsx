'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Icon from '@/components/Icon';
import { formatPrice } from '@/lib/format';
import { api, useShop } from './ShopProvider';
import VariantOptions, { useVariantSelection } from './VariantOptions';
import PriceTag from './PriceTag';

function Picker({ product, onClose }) {
  const { addToCart, toast } = useShop();
  const sel = useVariantSelection(product.variants);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const extra = Number(sel.variant?.price_adjustment || 0);

  async function add() {
    if (sel.missing) return setError(sel.missing);
    if (!sel.variant || sel.variant.stock <= 0) return setError('This option is out of stock.');
    setBusy(true);
    setError(null);
    try {
      await addToCart(product.id, sel.variant.id, 1);
      onClose();
    } catch (e) {
      setError(e.message);
      toast(e.message, { type: 'error' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="quickadd">
      <div className="quickadd__img">
        {product.images[0] && <Image src={product.images[0].url} alt={product.name} fill sizes="220px" />}
      </div>
      <div>
        <h3>{product.name}</h3>
        <PriceTag price={Number(product.price) + extra} sale={product.sale_price ? Number(product.sale_price) + extra : null} />
        <VariantOptions sel={sel} />
        {error && <p className="form-error" style={{ marginTop: 14 }}>{error}</p>}
        <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
          <button className="btn btn--primary" onClick={add} disabled={busy || sel.totalStock <= 0}>
            <Icon name="cart" size={18} /> {sel.totalStock <= 0 ? 'Out of Stock' : busy ? 'Adding…' : 'Add to Cart'}
          </button>
          <Link href={`/product/${product.slug}`} className="btn btn--outline" onClick={onClose}>
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function QuickAdd({ product: summary, onClose }) {
  const [product, setProduct] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api(`/api/products/${summary.id}`)
      .then((d) => setProduct(d.product))
      .catch((e) => setError(e.message));
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [summary.id, onClose]);

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={`Choose options for ${summary.name}`}>
        <button className="modal__close" onClick={onClose} aria-label="Close">
          <Icon name="x" size={18} />
        </button>
        {product ? (
          <Picker product={product} onClose={onClose} />
        ) : error ? (
          <p className="form-error" style={{ margin: 24 }}>{error}</p>
        ) : (
          <div className="quickadd">
            <div className="quickadd__img skeleton" />
            <div>
              <div className="skeleton" style={{ height: 24, width: '70%' }} />
              <div className="skeleton" style={{ height: 20, width: '30%', marginTop: 12 }} />
              <div className="skeleton" style={{ height: 44, marginTop: 24 }} />
              <p className="sr-only">Loading {formatPrice(0)}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
