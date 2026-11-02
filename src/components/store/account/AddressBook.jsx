'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/Icon';
import { CITIES, PROVINCES } from '@/lib/pakistan';
import { api, useShop } from '../ShopProvider';

const EMPTY = { name: '', phone: '', address: '', city: '', province: 'Punjab', postal_code: '', is_default: false };

export default function AddressBook({ addresses }) {
  const router = useRouter();
  const { toast } = useShop();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState(null);

  const open = (a) => {
    setEditing(a ? a.id : 'new');
    setForm(a ? { ...a, postal_code: a.postal_code || '', is_default: !!a.is_default } : EMPTY);
    setError(null);
  };

  async function save(e) {
    e.preventDefault();
    try {
      const r = await api(editing === 'new' ? '/api/account/addresses' : `/api/account/addresses/${editing}`, { method: editing === 'new' ? 'POST' : 'PUT', body: form });
      toast(r.message);
      setEditing(null);
      router.refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(id) {
    if (!confirm('Delete this address?')) return;
    await api(`/api/account/addresses/${id}`, { method: 'DELETE' });
    router.refresh();
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="form-grid">
        {addresses.map((a) => (
          <div key={a.id} className="panel panel__body" style={{ fontSize: 14.5, lineHeight: 1.6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <b>{a.name}</b>
              {a.is_default ? <span className="status status--active">Default</span> : null}
            </div>
            {a.phone}
            <br />
            {a.address}
            <br />
            {a.city}, {a.province} {a.postal_code}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="btn btn--outline btn--sm" onClick={() => open(a)}><Icon name="edit" size={15} /> Edit</button>
              <button className="btn btn--danger btn--sm" onClick={() => remove(a.id)}><Icon name="trash" size={15} /> Delete</button>
            </div>
          </div>
        ))}
      </div>
      {!editing && (
        <div><button className="btn btn--primary" onClick={() => open(null)}><Icon name="plus" size={18} /> Add new address</button></div>
      )}
      {editing && (
        <form className="panel" onSubmit={save}>
          <div className="panel__head"><h3>{editing === 'new' ? 'New Address' : 'Edit Address'}</h3></div>
          <div className="panel__body form-grid">
            <div className="field"><label>Full name</label><input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="field"><label>Mobile number</label><input className="input" type="tel" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="field span-2"><label>Complete address</label><textarea className="textarea" style={{ minHeight: 70 }} required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            <div className="field">
              <label>Province</label>
              <select className="select" value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })}>
                {PROVINCES.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="field">
              <label>City</label>
              <input className="input" list="ab-cities" required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              <datalist id="ab-cities">{(CITIES[form.province] || []).map((c) => <option key={c} value={c} />)}</datalist>
            </div>
            <div className="field"><label>Postal code</label><input className="input" maxLength={5} value={form.postal_code} onChange={(e) => setForm({ ...form, postal_code: e.target.value })} /></div>
            <label className="checkbox" style={{ alignSelf: 'end' }}><input type="checkbox" checked={form.is_default} onChange={(e) => setForm({ ...form, is_default: e.target.checked })} /> Set as default</label>
            {error && <p className="form-error span-2">{error}</p>}
            <div className="span-2" style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn--primary">Save address</button>
              <button type="button" className="btn btn--ghost" onClick={() => setEditing(null)}>Cancel</button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
