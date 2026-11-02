'use client';

import { useState } from 'react';
import Image from 'next/image';
import Icon from '@/components/Icon';
import { DeleteButton, FormMessage, Modal, SingleImage, Toggle, useMutation } from './ui';

const EMPTY = { placement: 'hero', badge: '', title: '', highlight: '', subtitle: '', description: '', offer_text: '', offer_highlight: '', button_text: 'Shop Now', button_link: '/shop', image: '', theme: 'light', sort_order: 0, status: 'active' };

function BannerForm({ initial, onClose }) {
  const [b, setB] = useState(initial);
  const [state, run] = useMutation();
  const set = (k, v) => setB((x) => ({ ...x, [k]: v }));
  const inp = (k, label, hint) => (
    <div className="field"><label>{label}</label><input className="input" value={b[k] || ''} onChange={(e) => set(k, e.target.value)} />{hint && <span className="hint">{hint}</span>}</div>
  );
  const hero = b.placement === 'hero';
  return (
    <Modal title={initial.id ? 'Edit banner' : 'New banner'} onClose={onClose}>
      <form className="form-grid" onSubmit={async (e) => { e.preventDefault(); try { await run(initial.id ? `/api/admin/banners/${initial.id}` : '/api/admin/banners', { method: initial.id ? 'PUT' : 'POST', body: b }); onClose(); } catch {} }}>
        <div className="field">
          <label>Placement</label>
          <select className="select" value={b.placement} onChange={(e) => set('placement', e.target.value)}>
            <option value="hero">Hero slider</option>
            <option value="promo">Promo banner (below best sellers)</option>
          </select>
        </div>
        <div className="field">
          <label>Style</label>
          <select className="select" value={b.theme} onChange={(e) => set('theme', e.target.value)}>
            <option value="light">Light background</option>
            <option value="dark">Dark green background</option>
          </select>
        </div>
        <div className="field span-2"><span className="label">Image *</span><SingleImage value={b.image} onChange={(v) => set('image', v)} folder="banners" /><span className="hint">Product on the right side works best. Recommended 1600×700px.</span></div>
        {inp('title', 'Title *', hero ? 'e.g. “Step Into”' : 'e.g. “Flat”')}
        {inp('highlight', 'Highlighted text', hero ? 'Shown in green, e.g. “Style”' : 'Shown large in yellow, e.g. “50% OFF”')}
        {inp('subtitle', 'Subtitle')}
        {hero && inp('badge', 'Badge', 'Small pill above the title')}
        {hero && inp('description', 'Description line')}
        {hero && inp('offer_text', 'Offer badge – small text', 'e.g. “Up To”')}
        {hero && inp('offer_highlight', 'Offer badge – big text', 'e.g. “50% OFF”')}
        {inp('button_text', 'Button text')}
        {inp('button_link', 'Button link', 'e.g. /sale or /category/men')}
        <div className="field"><label>Order</label><input className="input" type="number" value={b.sort_order} onChange={(e) => set('sort_order', e.target.value)} /></div>
        <div style={{ alignSelf: 'end' }}><Toggle checked={b.status === 'active'} onChange={(v) => set('status', v ? 'active' : 'inactive')} label="Active" /></div>
        <div className="span-2"><FormMessage state={state} /></div>
        <div className="span-2" style={{ display: 'flex', gap: 10 }}><button className="btn btn--primary" disabled={state.busy || !b.image}>Save banner</button><button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button></div>
      </form>
    </Modal>
  );
}

export default function BannerManager({ banners, embedded = false }) {
  const [editing, setEditing] = useState(null);
  const groups = [['hero', 'Big pictures at the top (they change every few seconds)'], ['promo', 'Offer banners below “Best Selling” (the first two shown)']];
  return (
    <>
      {!embedded && (
        <div className="page-bar">
          <div><h1>Banners</h1><p>The big pictures at the top of the homepage and the two offer banners lower down.</p></div>
        </div>
      )}
      {groups.map(([key, label]) => (
        <section className="panel" key={key}>
          <div className="panel__head"><h3>{label}</h3><button className="btn btn--outline btn--sm" onClick={() => setEditing({ ...EMPTY, placement: key, theme: key === 'promo' ? 'dark' : 'light' })}><Icon name="plus" size={14} /> Add picture</button></div>
          <div className="table-wrap">
            <table className="table">
              <tbody>
                {banners.filter((b) => b.placement === key).map((b) => (
                  <tr key={b.id}>
                    <td style={{ width: 160 }}><span className="thumb" style={{ width: 140, height: 70 }}><Image src={b.image} alt="" fill sizes="140px" /></span></td>
                    <td><b>{b.title} {b.highlight}</b><br /><small className="muted">{b.subtitle} {b.button_link && `→ ${b.button_link}`}</small></td>
                    <td>#{b.sort_order}</td>
                    <td><span className={`status status--${b.status}`}>{b.status}</span></td>
                    <td><div className="row-actions"><button className="icon-action" onClick={() => setEditing(b)} aria-label="Edit"><Icon name="edit" size={16} /></button><DeleteButton url={`/api/admin/banners/${b.id}`} /></div></td>
                  </tr>
                ))}
                {!banners.some((b) => b.placement === key) && <tr><td className="muted">Nothing here yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      ))}
      {editing && <BannerForm initial={editing} onClose={() => setEditing(null)} />}
    </>
  );
}
