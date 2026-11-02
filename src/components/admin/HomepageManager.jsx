'use client';

import { useState } from 'react';
import Image from 'next/image';
import Icon from '@/components/Icon';
import { DeleteButton, FormMessage, Modal, SingleImage, Toggle, useMutation } from './ui';

const SECTION_LABELS = {
  hero: 'Hero banner slider',
  categories: 'Shop by Category',
  best_sellers: 'Best Selling Products',
  promos: 'Promotional banners',
  featured: 'Featured Products',
  new_arrivals: 'New Arrivals',
  features: 'Why Choose Us',
  testimonials: 'Customer testimonials',
  newsletter: 'Newsletter strip',
};
const ICONS = ['truck', 'returns', 'shield', 'headset', 'card', 'tag', 'star', 'package'];

function ProductPicker({ products, value, onChange, label }) {
  const [q, setQ] = useState('');
  const selected = value.map((id) => products.find((p) => p.id === id)).filter(Boolean);
  const list = products.filter((p) => !value.includes(p.id) && p.name.toLowerCase().includes(q.toLowerCase())).slice(0, 40);
  const move = (i, d) => {
    const n = [...value];
    const j = i + d;
    if (j < 0 || j >= n.length) return;
    [n[i], n[j]] = [n[j], n[i]];
    onChange(n);
  };
  return (
    <div className="field span-2">
      <span className="label">{label}</span>
      <span className="hint">Pick products to show first, in this order. If you pick none, the shop chooses them automatically.</span>
      <div className="form-grid" style={{ marginTop: 6 }}>
        <div className="picker-list">
          {!selected.length && <p className="muted" style={{ fontSize: 13, padding: 6 }}>None picked – chosen automatically.</p>}
          {selected.map((p, i) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
              <b style={{ width: 18 }}>{i + 1}</b>
              <span className="thumb" style={{ width: 32, height: 32 }}>{p.image && <Image src={p.image} alt="" fill sizes="32px" />}</span>
              <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
              <button type="button" className="icon-action" style={{ width: 28, height: 28 }} onClick={() => move(i, -1)} aria-label="Move up"><Icon name="chevronLeft" size={14} style={{ transform: 'rotate(90deg)' }} /></button>
              <button type="button" className="icon-action" style={{ width: 28, height: 28 }} onClick={() => move(i, 1)} aria-label="Move down"><Icon name="chevronDown" size={14} /></button>
              <button type="button" className="icon-action icon-action--danger" style={{ width: 28, height: 28 }} onClick={() => onChange(value.filter((x) => x !== p.id))} aria-label="Remove"><Icon name="x" size={14} /></button>
            </div>
          ))}
        </div>
        <div>
          <input className="input" placeholder="Search products to add…" value={q} onChange={(e) => setQ(e.target.value)} style={{ height: 38, marginBottom: 6 }} />
          <div className="picker-list" style={{ maxHeight: 260 }}>
            {list.map((p) => (
              <button type="button" key={p.id} onClick={() => onChange([...value, p.id])} style={{ display: 'flex', alignItems: 'center', gap: 8, border: 0, background: 'none', textAlign: 'left', fontSize: 14, padding: 4 }}>
                <Icon name="plus" size={14} /> {p.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TestimonialForm({ initial, onClose }) {
  const [t, setT] = useState(initial);
  const [state, run] = useMutation();
  return (
    <Modal title={initial.id ? 'Edit testimonial' : 'New testimonial'} onClose={onClose} width={560}>
      <form className="form-grid" onSubmit={async (e) => { e.preventDefault(); try { await run(initial.id ? `/api/admin/testimonials/${initial.id}` : '/api/admin/testimonials', { method: initial.id ? 'PUT' : 'POST', body: t }); onClose(); } catch {} }}>
        <div className="field"><label>Customer name *</label><input className="input" required value={t.name} onChange={(e) => setT({ ...t, name: e.target.value })} /></div>
        <div className="field"><label>Rating</label><select className="select" value={t.rating} onChange={(e) => setT({ ...t, rating: Number(e.target.value) })}>{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} stars</option>)}</select></div>
        <div className="field span-2"><label>Quote *</label><textarea className="textarea" required maxLength={400} value={t.quote} onChange={(e) => setT({ ...t, quote: e.target.value })} /></div>
        <div className="field"><span className="label">Photo (optional)</span><SingleImage value={t.avatar} onChange={(v) => setT({ ...t, avatar: v })} folder="testimonials" /></div>
        <div style={{ display: 'grid', gap: 12, alignContent: 'start' }}>
          <div className="field"><label>Order</label><input className="input" type="number" value={t.sort_order} onChange={(e) => setT({ ...t, sort_order: e.target.value })} /></div>
          <Toggle checked={t.status === 'active'} onChange={(v) => setT({ ...t, status: v ? 'active' : 'inactive' })} label="Visible" />
        </div>
        <div className="span-2"><FormMessage state={state} /></div>
        <div className="span-2"><button className="btn btn--primary" disabled={state.busy}>Save</button></div>
      </form>
    </Modal>
  );
}

export default function HomepageManager({ homepage, products, categories, testimonials }) {
  const [h, setH] = useState(homepage);
  const [cats, setCats] = useState(categories);
  const [tm, setTm] = useState(null);
  const [state, run] = useMutation();
  const [catState, runCats] = useMutation();
  const set = (k, v) => setH((x) => ({ ...x, [k]: v }));
  const txt = (k, label) => (
    <div className="field"><label>{label}</label><input className="input" value={h[k] || ''} onChange={(e) => set(k, e.target.value)} /></div>
  );

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <form id="sections" style={{ scrollMarginTop: 80 }} className="panel" onSubmit={(e) => { e.preventDefault(); run('/api/admin/settings/homepage', { method: 'PUT', body: h }).catch(() => {}); }}>
        <div className="panel__head"><h3>Sections &amp; products</h3><button className="btn btn--primary btn--sm" disabled={state.busy}>{state.busy ? 'Saving…' : 'Save homepage'}</button></div>
        <div className="panel__body form-grid">
          <div className="field span-2">
            <span className="label">Which sections to show on the homepage</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 12, marginTop: 6 }}>
              {Object.entries(SECTION_LABELS).map(([k, label]) => (
                <Toggle key={k} checked={!!h.sections[k]} onChange={(v) => set('sections', { ...h.sections, [k]: v })} label={label} />
              ))}
            </div>
          </div>
          {txt('categories_title', 'Categories title')}
          {txt('categories_subtitle', 'Categories subtitle')}
          {txt('best_sellers_title', 'Best sellers title')}
          {txt('best_sellers_subtitle', 'Best sellers subtitle')}
          <ProductPicker label="Best selling products" products={products} value={h.best_seller_ids || []} onChange={(v) => set('best_seller_ids', v)} />
          {txt('featured_title', 'Featured title')}
          {txt('featured_subtitle', 'Featured subtitle')}
          <ProductPicker label="Featured products" products={products} value={h.featured_ids || []} onChange={(v) => set('featured_ids', v)} />
          {txt('new_arrivals_title', 'New arrivals title')}
          {txt('new_arrivals_subtitle', 'New arrivals subtitle')}
          {txt('features_title', '“Why choose us” title')}
          {txt('testimonials_title', 'Testimonials title')}
          <div className="field span-2">
            <span className="label">“Why choose us” items</span>
            <div style={{ display: 'grid', gap: 8 }}>
              {h.features.map((f, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '130px 1fr 1fr auto', gap: 8 }}>
                  <select className="select" style={{ height: 40 }} value={f.icon} onChange={(e) => set('features', h.features.map((x, j) => (j === i ? { ...x, icon: e.target.value } : x)))}>
                    {ICONS.map((ic) => <option key={ic}>{ic}</option>)}
                  </select>
                  <input className="input" style={{ height: 40 }} placeholder="Title" value={f.title} onChange={(e) => set('features', h.features.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
                  <input className="input" style={{ height: 40 }} placeholder="Text" value={f.text} onChange={(e) => set('features', h.features.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))} />
                  <button type="button" className="icon-action icon-action--danger" style={{ height: 40, width: 40 }} onClick={() => set('features', h.features.filter((_, j) => j !== i))} aria-label="Remove"><Icon name="trash" size={15} /></button>
                </div>
              ))}
              {h.features.length < 8 && <div><button type="button" className="btn btn--ghost btn--sm" onClick={() => set('features', [...h.features, { icon: 'check', title: '', text: '' }])}><Icon name="plus" size={14} /> Add item</button></div>}
            </div>
          </div>
          {txt('newsletter_title', 'Newsletter title')}
          {txt('newsletter_text', 'Newsletter text')}
          <div className="span-2"><FormMessage state={state} /></div>
          <div className="span-2"><button className="btn btn--primary" disabled={state.busy}>Save homepage</button></div>
        </div>
      </form>

      <section className="panel" id="categories" style={{ scrollMarginTop: 80 }}>
        <div className="panel__head">
          <h3>“Shop by Category” – which categories and in what order</h3>
          <button className="btn btn--primary btn--sm" disabled={catState.busy} onClick={() => runCats('/api/admin/categories/order', { method: 'PATCH', body: { items: cats.map((c) => ({ id: c.id, sort_order: Number(c.sort_order) || 0, show_on_home: !!c.show_on_home })) } }).catch(() => {})}>Save order</button>
        </div>
        <div className="panel__body" style={{ display: 'grid', gap: 8 }}>
          <FormMessage state={catState} />
          {cats.map((c, i) => (
            <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '48px 1fr 90px auto', gap: 12, alignItems: 'center' }}>
              <span className="thumb">{c.image && <Image src={c.image} alt="" fill sizes="48px" />}</span>
              <span>{c.name}</span>
              <input className="input" type="number" style={{ height: 38 }} value={c.sort_order} onChange={(e) => setCats(cats.map((x, j) => (j === i ? { ...x, sort_order: e.target.value } : x)))} aria-label="Order" />
              <Toggle checked={!!c.show_on_home} onChange={(v) => setCats(cats.map((x, j) => (j === i ? { ...x, show_on_home: v } : x)))} label="On homepage" />
            </div>
          ))}
        </div>
      </section>

      <section className="panel" id="reviews" style={{ scrollMarginTop: 80 }}>
        <div className="panel__head">
          <h3>Customer reviews on the homepage</h3>
          <button className="btn btn--primary btn--sm" onClick={() => setTm({ name: '', quote: '', avatar: '', rating: 5, sort_order: testimonials.length, status: 'active' })}><Icon name="plus" size={15} /> Add</button>
        </div>
        <div className="table-wrap">
          <table className="table">
            <tbody>
              {testimonials.map((t) => (
                <tr key={t.id}>
                  <td style={{ width: '25%' }}><b>{t.name}</b><br /><small className="muted">{'★'.repeat(t.rating)}</small></td>
                  <td>“{t.quote}”</td>
                  <td><span className={`status status--${t.status}`}>{t.status}</span></td>
                  <td><div className="row-actions"><button className="icon-action" onClick={() => setTm({ ...t, avatar: t.avatar || '' })} aria-label="Edit"><Icon name="edit" size={16} /></button><DeleteButton url={`/api/admin/testimonials/${t.id}`} /></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {tm && <TestimonialForm initial={tm} onClose={() => setTm(null)} />}
    </div>
  );
}
