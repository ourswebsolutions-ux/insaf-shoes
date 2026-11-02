'use client';

import { useState } from 'react';
import Icon from '@/components/Icon';
import { api } from './ShopProvider';

export function SocialLinks({ social, className = 'social', label }) {
  const items = [
    ['facebook', social.facebook],
    ['instagram', social.instagram],
    ['youtube', social.youtube],
    ['tiktok', social.tiktok],
  ].filter(([, url]) => url);
  if (!items.length) return null;
  return (
    <div className={className}>
      {label && <span className="social__label">{label}</span>}
      {items.map(([name, url]) => (
        <a key={name} href={url} target="_blank" rel="noopener noreferrer" aria-label={name}>
          <Icon name={name} size={20} />
        </a>
      ))}
    </div>
  );
}

export default function Newsletter({ title, text, social }) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState({ status: 'idle', message: '' });

  async function submit(e) {
    e.preventDefault();
    setState({ status: 'loading', message: '' });
    try {
      const res = await api('/api/newsletter', { method: 'POST', body: { email } });
      setState({ status: 'done', message: res.message });
      setEmail('');
    } catch (err) {
      setState({ status: 'error', message: err.message });
    }
  }

  return (
    <section className="newsletter" aria-label="Newsletter">
      <div className="container newsletter__inner">
        <div className="newsletter__intro">
          <Icon name="mail" size={44} strokeWidth={1.6} />
          <div>
            <h3>{title}</h3>
            <p>{text}</p>
          </div>
        </div>
        <div style={{ flex: 1, maxWidth: 500, marginLeft: 'auto', width: '100%' }} className="newsletter__form-wrap">
          <form className="newsletter__form" onSubmit={submit} style={{ maxWidth: 'none' }}>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email address..." aria-label="Email address" />
            <button className="btn btn--bright" disabled={state.status === 'loading'}>
              {state.status === 'loading' ? 'Subscribing…' : 'Subscribe'}
            </button>
          </form>
          {state.message && <p className="newsletter__msg" role="status">{state.message}</p>}
        </div>
        <SocialLinks social={social} label="Follow Us:" />
      </div>
    </section>
  );
}
