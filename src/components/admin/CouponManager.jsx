'use client';

import { useState } from 'react';
import Icon from '@/components/Icon';
import { formatDate, formatPrice } from '@/lib/format';
import { DeleteButton, FormMessage, Modal, Toggle, useMutation } from './ui';

const EMPTY = { code: '', description: '', type: 'percent', value: '', min_order: 0, max_discount: '', usage_limit: '', per_customer_limit: '', starts_at: '', expires_at: '', status: 'active' };
const toInput = (d) => (d ? new Date(d).toISOString().slice(0, 16) : '');

function CouponForm({ initial, onClose }) {
  const [c, setC] = useState(initial);
  const [state, run] = useMutation();
  const set = (k, v) => setC((x) => ({ ...x, [k]: v }));
  return (
    <Modal title={initial.id ? `Edit ${initial.code}` : 'New Coupon'} onClose={onClose}>
      <form
        className="form-grid"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await run(initial.id ? `/api/admin/coupons/${initial.id}` : '/api/admin/coupons', { method: initial.id ? 'PUT' : 'POST', body: c });
            onClose();
          } catch {}
        }}
      >
        <div className="field"><label>Code *</label><input className="input" required style={{ textTransform: 'uppercase' }} value={c.code} onChange={(e) => set('code', e.target.value)} /></div>
        <div className="field"><label>Description</label><input className="input" value={c.description || ''} onChange={(e) => set('description', e.target.value)} /></div>
        <div className="field">
          <label>Discount type</label>
          <select className="select" value={c.type} onChange={(e) => set('type', e.target.value)}>
            <option value="percent">Percentage (%)</option>
            <option value="fixed">Fixed amount (Rs.)</option>
          </select>
        </div>
        <div className="field"><label>Value *</label><input className="input" type="number" min="1" required value={c.value} onChange={(e) => set('value', e.target.value)} /></div>
        <div className="field"><label>Minimum order (Rs.)</label><input className="input" type="number" min="0" value={c.min_order} onChange={(e) => set('min_order', e.target.value)} /></div>
        <div className="field"><label>Max discount (Rs.)</label><input className="input" type="number" min="0" value={c.max_discount ?? ''} placeholder="No cap" onChange={(e) => set('max_discount', e.target.value)} /></div>
        <div className="field"><label>Total usage limit</label><input className="input" type="number" min="0" value={c.usage_limit ?? ''} placeholder="Unlimited" onChange={(e) => set('usage_limit', e.target.value)} /></div>
        <div className="field"><label>Uses per customer</label><input className="input" type="number" min="0" value={c.per_customer_limit ?? ''} placeholder="Unlimited" onChange={(e) => set('per_customer_limit', e.target.value)} /></div>
        <div className="field"><label>Starts</label><input className="input" type="datetime-local" value={c.starts_at || ''} onChange={(e) => set('starts_at', e.target.value)} /></div>
        <div className="field"><label>Expires</label><input className="input" type="datetime-local" value={c.expires_at || ''} onChange={(e) => set('expires_at', e.target.value)} /></div>
        <div className="span-2"><Toggle checked={c.status === 'active'} onChange={(v) => set('status', v ? 'active' : 'inactive')} label="Active" /></div>
        <div className="span-2"><FormMessage state={state} /></div>
        <div className="span-2" style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn--primary" disabled={state.busy}>Save coupon</button>
          <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </Modal>
  );
}

export default function CouponManager({ coupons }) {
  const [editing, setEditing] = useState(null);
  const now = Date.now();
  return (
    <>
      <div className="page-bar">
        <div><h1>Discounts</h1><p>Discount codes customers type at checkout (e.g. WELCOME10). To put a single product on sale, edit the product and set a discounted price.</p></div>
        <button className="btn btn--primary btn--sm" onClick={() => setEditing(EMPTY)}><Icon name="plus" size={16} /> Add Discount Code</button>
      </div>
      <section className="panel">
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Code</th><th>Discount</th><th>Min order</th><th>Used</th><th>Valid</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {coupons.map((c) => {
                const expired = c.expires_at && new Date(c.expires_at).getTime() < now;
                return (
                  <tr key={c.id}>
                    <td><b>{c.code}</b><br /><small className="muted">{c.description}</small></td>
                    <td>{c.type === 'percent' ? `${Number(c.value)}%` : formatPrice(c.value)}{c.max_discount ? <small className="muted"> (max {formatPrice(c.max_discount)})</small> : null}</td>
                    <td>{formatPrice(c.min_order)}</td>
                    <td>{c.used_count}{c.usage_limit ? ` / ${c.usage_limit}` : ''}</td>
                    <td className="nowrap muted">{c.starts_at ? formatDate(c.starts_at) : 'Now'} – {c.expires_at ? formatDate(c.expires_at) : 'No expiry'}</td>
                    <td><span className={`status status--${expired ? 'cancelled' : c.status}`}>{expired ? 'expired' : c.status}</span></td>
                    <td>
                      <div className="row-actions">
                        <button className="icon-action" aria-label="Edit" onClick={() => setEditing({ ...c, value: Number(c.value), min_order: Number(c.min_order), starts_at: toInput(c.starts_at), expires_at: toInput(c.expires_at) })}><Icon name="edit" size={16} /></button>
                        <DeleteButton url={`/api/admin/coupons/${c.id}`} />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!coupons.length && <tr><td colSpan={7} className="muted" style={{ textAlign: 'center', padding: 40 }}>No coupons yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
      {editing && <CouponForm initial={editing} onClose={() => setEditing(null)} />}
    </>
  );
}
