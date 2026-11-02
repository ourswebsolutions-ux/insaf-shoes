'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from '@/components/Icon';
import { formatDate } from '@/lib/format';
import { api, useShop } from '../ShopProvider';
import Stars from '../Stars';

function ReviewForm({ productId }) {
  const { customer } = useShop();
  const pathname = usePathname();
  const [rating, setRating] = useState(0);
  const [form, setForm] = useState({ title: '', comment: '' });
  const [state, setState] = useState({ status: 'idle' });

  if (!customer)
    return (
      <p className="notice notice--green">
        <Icon name="user" /> <span><Link href={`/login?next=${encodeURIComponent(pathname)}`} className="link">Log in</Link> to write a review.</span>
      </p>
    );
  if (state.status === 'done') return <p className="form-success">{state.message}</p>;

  async function submit(e) {
    e.preventDefault();
    setState({ status: 'loading' });
    try {
      const res = await api('/api/reviews', { method: 'POST', body: { product_id: productId, rating, ...form } });
      setState({ status: 'done', message: res.message });
    } catch (err) {
      setState({ status: 'error', message: err.message });
    }
  }

  return (
    <form onSubmit={submit} style={{ display: 'grid', gap: 14, marginTop: 8 }}>
      <h3 style={{ fontSize: 18 }}>Write a review</h3>
      <div className="field">
        <span className="label">Your rating</span>
        <div className="star-input" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((i) => (
            <button key={i} type="button" className={i <= rating ? 'is-on' : ''} onClick={() => setRating(i)} aria-label={`${i} star${i > 1 ? 's' : ''}`} role="radio" aria-checked={rating === i}>
              <Icon name="starFill" size={26} />
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <label htmlFor="rv-title">Title (optional)</label>
        <input id="rv-title" className="input" maxLength={190} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      </div>
      <div className="field">
        <label htmlFor="rv-comment">Your review</label>
        <textarea id="rv-comment" className="textarea" required minLength={10} maxLength={2000} value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} />
      </div>
      {state.status === 'error' && <p className="form-error">{state.message}</p>}
      <div>
        <button className="btn btn--primary" disabled={state.status === 'loading'}>
          {state.status === 'loading' ? 'Submitting…' : 'Submit review'}
        </button>
      </div>
    </form>
  );
}

export default function ProductTabs({ product, reviews }) {
  const [tab, setTab] = useState('description');
  const dist = [5, 4, 3, 2, 1].map((n) => ({ n, c: reviews.filter((r) => r.rating === n).length }));

  return (
    <section className="section" id="details">
      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'description'} className={tab === 'description' ? 'is-active' : ''} onClick={() => setTab('description')}>
          Description
        </button>
        <button role="tab" aria-selected={tab === 'reviews'} className={tab === 'reviews' ? 'is-active' : ''} onClick={() => setTab('reviews')} id="reviews-tab">
          Reviews ({product.rating_count})
        </button>
        <button role="tab" aria-selected={tab === 'shipping'} className={tab === 'shipping' ? 'is-active' : ''} onClick={() => setTab('shipping')}>
          Delivery &amp; Returns
        </button>
      </div>

      {tab === 'description' && (
        <div className="prose">
          {(product.description || product.short_description || '').split(/\n{2,}/).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          <ul style={{ marginTop: 14 }}>
            <li>SKU: {product.sku}</li>
            {product.sizes.length > 0 && <li>Available sizes (EU): {product.sizes.join(', ')}</li>}
            {product.colors.length > 0 && <li>Colours: {product.colors.join(', ')}</li>}
          </ul>
        </div>
      )}

      {tab === 'reviews' && (
        <div className="reviews">
          <div className="review-summary">
            <strong>{Number(product.rating_avg).toFixed(1)}</strong>
            <Stars value={product.rating_avg} size={20} />
            <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 6 }}>Based on {product.rating_count} reviews</p>
            <div style={{ display: 'grid', gap: 6, marginTop: 14, textAlign: 'left', fontSize: 13 }}>
              {dist.map((d) => (
                <div key={d.n} style={{ display: 'grid', gridTemplateColumns: '28px 1fr 24px', gap: 8, alignItems: 'center' }}>
                  <span>{d.n}★</span>
                  <span className="ship-progress__bar" style={{ marginTop: 0 }}>
                    <span style={{ width: `${reviews.length ? (d.c / reviews.length) * 100 : 0}%`, background: '#f5b301' }} />
                  </span>
                  <span>{d.c}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            {reviews.length === 0 && <p style={{ color: 'var(--muted)' }}>No written reviews yet. Be the first to share your thoughts!</p>}
            {reviews.map((r) => (
              <article className="review" key={r.id}>
                <div className="review__head">
                  <span>
                    <b>{r.name}</b> {r.is_verified_purchase ? <span className="verified"><Icon name="check" size={13} /> Verified purchase</span> : null}
                  </span>
                  <span style={{ color: 'var(--muted)' }}>{formatDate(r.created_at)}</span>
                </div>
                <Stars value={r.rating} />
                {r.title && <h4>{r.title}</h4>}
                <p>{r.comment}</p>
              </article>
            ))}
            <div style={{ marginTop: 24 }}>
              <ReviewForm productId={product.id} />
            </div>
          </div>
        </div>
      )}

      {tab === 'shipping' && (
        <div className="prose">
          <p>{product.shippingText}</p>
          <p>
            Not the right size? Exchanges and returns are accepted within 7 days of delivery for unworn items in original packaging. See our{' '}
            <Link href="/return-policy" className="link">Return &amp; Refund Policy</Link>.
          </p>
        </div>
      )}
    </section>
  );
}
