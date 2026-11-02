'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../ShopProvider';

function useSubmit(fn) {
  const [state, setState] = useState({ status: 'idle' });
  const submit = async (e) => {
    e.preventDefault();
    setState({ status: 'loading' });
    try {
      const res = await fn();
      setState({ status: 'done', message: res.message });
    } catch (err) {
      setState({ status: 'error', message: err.message });
    }
  };
  return [state, submit];
}

export function ProfileForm({ customer }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: customer.name, phone: customer.phone || '' });
  const [state, submit] = useSubmit(async () => {
    const r = await api('/api/account', { method: 'PATCH', body: form });
    router.refresh();
    return r;
  });
  return (
    <form className="panel" onSubmit={submit}>
      <div className="panel__head"><h3>Profile</h3></div>
      <div className="panel__body form-grid">
        <div className="field">
          <label htmlFor="pf-name">Full name</label>
          <input id="pf-name" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="field">
          <label htmlFor="pf-phone">Mobile number</label>
          <input id="pf-phone" className="input" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div className="field span-2">
          <label htmlFor="pf-email">Email</label>
          <input id="pf-email" className="input" value={customer.email} disabled />
        </div>
        {state.message && <p className={`span-2 ${state.status === 'error' ? 'form-error' : 'form-success'}`}>{state.message}</p>}
        <div className="span-2"><button className="btn btn--primary" disabled={state.status === 'loading'}>Save changes</button></div>
      </div>
    </form>
  );
}

export function PasswordForm() {
  const [form, setForm] = useState({ current: '', next: '' });
  const [state, submit] = useSubmit(async () => {
    const r = await api('/api/account/password', { method: 'POST', body: form });
    setForm({ current: '', next: '' });
    return r;
  });
  return (
    <form className="panel" onSubmit={submit}>
      <div className="panel__head"><h3>Change Password</h3></div>
      <div className="panel__body form-grid">
        <div className="field">
          <label htmlFor="pw-cur">Current password</label>
          <input id="pw-cur" className="input" type="password" autoComplete="current-password" value={form.current} onChange={(e) => setForm({ ...form, current: e.target.value })} />
        </div>
        <div className="field">
          <label htmlFor="pw-new">New password</label>
          <input id="pw-new" className="input" type="password" autoComplete="new-password" minLength={8} value={form.next} onChange={(e) => setForm({ ...form, next: e.target.value })} />
        </div>
        {state.message && <p className={`span-2 ${state.status === 'error' ? 'form-error' : 'form-success'}`}>{state.message}</p>}
        <div className="span-2"><button className="btn btn--primary" disabled={state.status === 'loading'}>Update password</button></div>
      </div>
    </form>
  );
}
