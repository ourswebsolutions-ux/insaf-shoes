'use client';

import { useState } from 'react';
import Icon from '@/components/Icon';
import { ALL_CITIES } from '@/lib/pakistan';
import { FormMessage, Toggle, useMutation } from './ui';

function useSettingsForm(key, initial) {
  const [v, setV] = useState(initial);
  const [state, run] = useMutation();
  const setPath = (path, val) =>
    setV((cur) => {
      const next = structuredClone(cur);
      const keys = path.split('.');
      let o = next;
      for (const k of keys.slice(0, -1)) o = o[k];
      o[keys.at(-1)] = val;
      return next;
    });
  const save = (e) => {
    e?.preventDefault();
    return run(`/api/admin/settings/${key}`, { method: 'PUT', body: v }).catch(() => {});
  };
  return { v, setPath, save, state };
}

const Field = ({ label, hint, children, span }) => (
  <div className={`field ${span ? 'span-2' : ''}`}>
    <label>{label}</label>
    {children}
    {hint && <span className="hint">{hint}</span>}
  </div>
);

function SaveBar({ state, label = 'Save settings' }) {
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <FormMessage state={state} />
      <div><button className="btn btn--primary" disabled={state.busy}>{state.busy ? 'Saving…' : label}</button></div>
    </div>
  );
}

export function StoreSettingsForm({ store, topbar }) {
  const s = useSettingsForm('store', store);
  const t = useSettingsForm('topbar', topbar);
  const inp = (path, props = {}) => {
    const val = path.split('.').reduce((o, k) => o?.[k], s.v);
    return <input className="input" value={val ?? ''} onChange={(e) => s.setPath(path, e.target.value)} {...props} />;
  };
  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <form className="panel" onSubmit={s.save}>
        <div className="panel__head"><h3>Shop details</h3></div>
        <div className="panel__body form-grid">
          <Field label="Shop name">{inp('name', { required: true })}</Field>
          <Field label="Tagline">{inp('tagline')}</Field>
          <Field label="About your shop (shown at the bottom of every page)" span><textarea className="textarea" style={{ minHeight: 70 }} value={s.v.about} onChange={(e) => s.setPath('about', e.target.value)} /></Field>
          <Field label="Phone">{inp('phone')}</Field>
          <Field label="WhatsApp number" hint="Customers tap the green WhatsApp button to message you here">{inp('whatsapp')}</Field>
          <Field label="Email">{inp('email', { type: 'email' })}</Field>
          <Field label="Address">{inp('address')}</Field>
          <Field label="Facebook URL">{inp('social.facebook')}</Field>
          <Field label="Instagram URL">{inp('social.instagram')}</Field>
          <Field label="YouTube URL">{inp('social.youtube')}</Field>
          <Field label="TikTok URL">{inp('social.tiktok')}</Field>
          <Field label="Website title on Google" span>{inp('seo_title')}</Field>
          <Field label="Website description on Google" span><textarea className="textarea" style={{ minHeight: 70 }} value={s.v.seo_description} onChange={(e) => s.setPath('seo_description', e.target.value)} /></Field>
          <div className="span-2"><SaveBar state={s.state} /></div>
        </div>
      </form>
      <form className="panel" onSubmit={t.save}>
        <div className="panel__head"><h3>Green strip at the very top of the website</h3></div>
        <div className="panel__body form-grid">
          <Field label="Left message"><input className="input" value={t.v.left} onChange={(e) => t.setPath('left', e.target.value)} /></Field>
          <Field label="Middle message"><input className="input" value={t.v.center} onChange={(e) => t.setPath('center', e.target.value)} /></Field>
          <Field label="Right message"><input className="input" value={t.v.right} onChange={(e) => t.setPath('right', e.target.value)} /></Field>
          <div className="span-2"><SaveBar state={t.state} /></div>
        </div>
      </form>
    </div>
  );
}

export function ShippingSettingsForm({ shipping }) {
  const s = useSettingsForm('shipping', { ...shipping, city_fees: shipping.city_fees || {} });
  const [city, setCity] = useState('');
  const [fee, setFee] = useState('');
  return (
    <form className="panel" onSubmit={s.save}>
      <div className="panel__head"><h3>Delivery charges</h3></div>
      <div className="panel__body form-grid">
        <Field label="Delivery charge per order (Rs.)"><input className="input" type="number" min="0" value={s.v.flat_fee} onChange={(e) => s.setPath('flat_fee', e.target.value)} /></Field>
        <Field label="Free delivery when the order is above (Rs.)" hint="Type 0 if you never offer free delivery"><input className="input" type="number" min="0" value={s.v.free_threshold} onChange={(e) => s.setPath('free_threshold', e.target.value)} /></Field>
        <Field label="Extra charge for Cash on Delivery (Rs.)" hint="Usually 0. Added only when the customer pays cash on delivery"><input className="input" type="number" min="0" value={s.v.cod_fee} onChange={(e) => s.setPath('cod_fee', e.target.value)} /></Field>
        <Field label="How long delivery takes" hint="Shown to customers, e.g. 3-5 working days"><input className="input" value={s.v.estimated_days} onChange={(e) => s.setPath('estimated_days', e.target.value)} /></Field>
        <div className="field span-2">
          <span className="label">Different delivery charge for some cities (optional)</span>
          <span className="hint">For example a higher charge for far-away cities. Free delivery above still applies.</span>
          <div style={{ display: 'grid', gap: 8, marginTop: 6 }}>
            {Object.entries(s.v.city_fees).map(([c, f]) => (
              <div key={c} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ flex: 1 }}>{c}</span>
                <input className="input" type="number" min="0" style={{ width: 140, height: 38 }} value={f} onChange={(e) => s.setPath('city_fees', { ...s.v.city_fees, [c]: Number(e.target.value) })} />
                <button type="button" className="icon-action icon-action--danger" onClick={() => { const n = { ...s.v.city_fees }; delete n[c]; s.setPath('city_fees', n); }} aria-label={`Remove ${c}`}><Icon name="trash" size={15} /></button>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="input" list="ship-cities" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} style={{ height: 38 }} />
              <datalist id="ship-cities">{ALL_CITIES.map((c) => <option key={c} value={c} />)}</datalist>
              <input className="input" type="number" min="0" placeholder="Fee" value={fee} onChange={(e) => setFee(e.target.value)} style={{ width: 140, height: 38 }} />
              <button type="button" className="btn btn--outline btn--sm" onClick={() => { if (city && fee !== '') { s.setPath('city_fees', { ...s.v.city_fees, [city]: Number(fee) }); setCity(''); setFee(''); } }}>Add</button>
            </div>
          </div>
        </div>
        <div className="span-2"><SaveBar state={s.state} /></div>
      </div>
    </form>
  );
}

export function PaymentSettingsForm({ payments, secrets, callbackBase }) {
  const s = useSettingsForm('payments', payments);
  const p = s.v;
  const txt = (path, props = {}) => {
    const val = path.split('.').reduce((o, k) => o?.[k], p);
    return <input className="input" value={val ?? ''} onChange={(e) => s.setPath(path, e.target.value)} {...props} />;
  };
  return (
    <form onSubmit={s.save} style={{ display: 'grid', gap: 20 }}>
      <section className="panel">
        <div className="panel__head"><h3>Cash on Delivery</h3><Toggle checked={p.cod.enabled} onChange={(v) => s.setPath('cod.enabled', v)} label={p.cod.enabled ? 'Enabled' : 'Disabled'} /></div>
        <div className="panel__body form-grid">
          <Field label="Largest order allowed with cash on delivery (Rs.)" hint="Type 0 for no limit">{txt('cod.max_order', { type: 'number', min: 0 })}</Field>
        </div>
      </section>
      <section className="panel">
        <div className="panel__head"><h3>Bank / Mobile Account Transfer</h3><Toggle checked={p.bank_transfer.enabled} onChange={(v) => s.setPath('bank_transfer.enabled', v)} label={p.bank_transfer.enabled ? 'Enabled' : 'Disabled'} /></div>
        <div className="panel__body form-grid">
          <Field label="Bank name">{txt('bank_transfer.bank_name')}</Field>
          <Field label="Account title">{txt('bank_transfer.account_title')}</Field>
          <Field label="Account number">{txt('bank_transfer.account_number')}</Field>
          <Field label="IBAN">{txt('bank_transfer.iban')}</Field>
          <Field label="JazzCash account number" hint="Optional – customers can send money to this number">{txt('bank_transfer.jazzcash_number', { placeholder: '03XX XXXXXXX' })}</Field>
          <Field label="JazzCash account title">{txt('bank_transfer.jazzcash_title')}</Field>
          <Field label="Easypaisa account number" hint="Optional – customers can send money to this number">{txt('bank_transfer.easypaisa_number', { placeholder: '03XX XXXXXXX' })}</Field>
          <Field label="Easypaisa account title">{txt('bank_transfer.easypaisa_title')}</Field>
          <Field label="Message for customers" span><textarea className="textarea" style={{ minHeight: 70 }} value={p.bank_transfer.instructions} onChange={(e) => s.setPath('bank_transfer.instructions', e.target.value)} /></Field>
        </div>
      </section>
      <section className="panel">
        <div className="panel__head"><h3>JazzCash online payment</h3><Toggle checked={p.jazzcash.enabled} onChange={(v) => s.setPath('jazzcash.enabled', v)} label={p.jazzcash.enabled ? 'Enabled' : 'Disabled'} /></div>
        <div className="panel__body form-grid">
          <Field label="Merchant ID">{txt('jazzcash.merchant_id')}</Field>
          <Field label="Password" hint={secrets.jazzcash_password ? 'Saved – leave blank to keep' : ''}>{txt('jazzcash.password', { type: 'password', autoComplete: 'off' })}</Field>
          <Field label="Integrity salt" hint={secrets.jazzcash_salt ? 'Saved – leave blank to keep' : ''}>{txt('jazzcash.integrity_salt', { type: 'password', autoComplete: 'off' })}</Field>
          <div style={{ alignSelf: 'end' }}><Toggle checked={p.jazzcash.sandbox} onChange={(v) => s.setPath('jazzcash.sandbox', v)} label="Test mode (turn off when going live)" /></div>
          <p className="hint span-2 muted" style={{ fontSize: 13 }}>Get these three details from your JazzCash merchant account. Give JazzCash this return address: <code>{callbackBase}/api/payments/jazzcash/callback</code>. Orders are marked paid only after the signed response is verified.</p>
        </div>
      </section>
      <section className="panel">
        <div className="panel__head"><h3>Easypaisa online payment</h3><Toggle checked={p.easypaisa.enabled} onChange={(v) => s.setPath('easypaisa.enabled', v)} label={p.easypaisa.enabled ? 'Enabled' : 'Disabled'} /></div>
        <div className="panel__body form-grid">
          <Field label="Store ID">{txt('easypaisa.store_id')}</Field>
          <Field label="Hash key" hint={secrets.easypaisa_key ? 'Saved – leave blank to keep' : '16/24/32 characters'}>{txt('easypaisa.hash_key', { type: 'password', autoComplete: 'off' })}</Field>
          <div><Toggle checked={p.easypaisa.sandbox} onChange={(v) => s.setPath('easypaisa.sandbox', v)} label="Test mode (turn off when going live)" /></div>
          <p className="hint span-2 muted" style={{ fontSize: 13 }}>Get these from your Easypaisa merchant account. Easypaisa payments show as “Pending Verification” – check them in your Easypaisa account, then mark the order as paid.</p>
        </div>
      </section>
      <SaveBar state={s.state} label="Save payment options" />
    </form>
  );
}
