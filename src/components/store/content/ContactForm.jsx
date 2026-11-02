'use client';

import { useState } from 'react';
import { api } from '../ShopProvider';

export default function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [state, setState] = useState({ status: 'idle' });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  if (state.status === 'done') return <p className="form-success">{state.message}</p>;
  return (
    <form
      className="panel panel__body form-grid"
      onSubmit={async (e) => {
        e.preventDefault();
        setState({ status: 'loading' });
        try {
          const r = await api('/api/contact', { method: 'POST', body: form });
          setState({ status: 'done', message: r.message });
        } catch (err) {
          setState({ status: 'error', message: err.message });
        }
      }}
    >
      <div className="field"><label htmlFor="ct-name">Your name *</label><input id="ct-name" className="input" required value={form.name} onChange={set('name')} /></div>
      <div className="field"><label htmlFor="ct-phone">Mobile number</label><input id="ct-phone" className="input" type="tel" value={form.phone} onChange={set('phone')} /></div>
      <div className="field"><label htmlFor="ct-email">Email</label><input id="ct-email" className="input" type="email" value={form.email} onChange={set('email')} /></div>
      <div className="field"><label htmlFor="ct-subject">Subject</label><input id="ct-subject" className="input" value={form.subject} onChange={set('subject')} /></div>
      <div className="field span-2"><label htmlFor="ct-msg">Message *</label><textarea id="ct-msg" className="textarea" required value={form.message} onChange={set('message')} /></div>
      {state.status === 'error' && <p className="form-error span-2">{state.message}</p>}
      <div className="span-2"><button className="btn btn--primary" disabled={state.status === 'loading'}>{state.status === 'loading' ? 'Sending…' : 'Send message'}</button></div>
    </form>
  );
}
