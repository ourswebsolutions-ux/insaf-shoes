'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Icon from '@/components/Icon';
import { discountPercent, formatCount } from '@/lib/format';
import { useShop } from './ShopProvider';
import PriceTag from './PriceTag';
import Stars from './Stars';

export default function ProductCard({ product, index = 0, priority = false }) {
  const { addToCart, openQuickAdd, wishlist, toggleWishlist, toast } = useShop();
  const [busy, setBusy] = useState(false);
  const off = discountPercent(product.price, product.sale_price);
  const outOfStock = product.stock <= 0;
  const wished = wishlist.has(product.id);
  const href = `/product/${product.slug}`;
  const colorLabel = product.colors?.length === 1 ? ` (${product.colors[0]})` : '';

  async function handleAdd() {
    if (!product.quick_variant_id) return openQuickAdd(product);
    setBusy(true);
    try {
      await addToCart(product.id, product.quick_variant_id, 1);
    } catch (e) {
      toast(e.message, { type: 'error' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="pcard">
      <Link href={href} className="pcard__media" aria-label={product.name} tabIndex={-1}>
        {product.image && (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 680px) 50vw, (max-width: 900px) 33vw, (max-width: 1240px) 25vw, 250px"
            priority={priority}
          />
        )}
        {product.image2 && <Image src={product.image2} alt="" fill className="alt" sizes="250px" loading="lazy" />}
      </Link>
      <div className="pcard__badges">
        {off > 0 && <span className={`badge ${index % 2 ? 'badge--red' : ''}`}>-{off}%</span>}
        {off === 0 && product.is_new_arrival ? <span className="badge badge--dark">New</span> : null}
      </div>
      <button
        type="button"
        className={`pcard__wish ${wished ? 'is-on' : ''}`}
        onClick={() => toggleWishlist(product.id)}
        aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
        aria-pressed={wished}
      >
        <Icon name={wished ? 'heartFill' : 'heart'} size={18} />
      </button>
      <div className="pcard__body">
        <h3 className="pcard__name">
          <Link href={href}>
            {product.name}
            {colorLabel}
          </Link>
        </h3>
        {product.rating_count > 0 && (
          <div className="rating">
            <Stars value={product.rating_avg} size={14} />
            <span>({formatCount(product.rating_count)})</span>
          </div>
        )}
        <PriceTag price={product.price} sale={product.sale_price} />
        {!outOfStock && product.stock <= 3 && <p className="pcard__stock">Only {product.stock} left</p>}
        <div className="pcard__cta" style={{ marginTop: 'auto', paddingTop: 12 }}>
          <button className="btn btn--primary" onClick={handleAdd} disabled={busy || outOfStock}>
            {busy ? <span className="spinner" /> : <Icon name="cart" size={18} />}
            <span>{outOfStock ? 'Out of Stock' : 'Add to Cart'}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
