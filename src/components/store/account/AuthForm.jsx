'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, useShop } from '../ShopProvider';

export default function AuthForm({ mode }) {
  const router = useRouter();
  const params = useSearchParams();
  const { setCustomer, refreshCart } = useShop();
  const next = params.get('next');
  const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : '/account';
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const isRegister = mode === 'register';

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setErrors({});
    try {
      const body = isRegister ? form : { email: form.email, password: form.password };
      const res = await api(`/api/auth/${mode}`, { method: 'POST', body });
      setCustomer(res.customer);
      await refreshCart();
      router.push(safeNext);
      router.refresh();
    } catch (err) {
      setError(err.message);
      if (err.details) setErrors(err.details);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      {isRegister && (
        <div className="field">
          <label htmlFor="au-name">Full name</label>
          <input id="au-name" className="input" autoComplete="name" required value={form.name} onChange={set('name')} aria-invalid={!!errors.name} />
          {errors.name && <span className="error">{errors.name}</span>}
        </div>
      )}
      <div className="field">
        <label htmlFor="au-email">Email address</label>
        <input id="au-email" className="input" type="email" autoComplete="email" required value={form.email} onChange={set('email')} aria-invalid={!!errors.email} />
        {errors.email && <span className="error">{errors.email}</span>}
      </div>
      {isRegister && (
        <div className="field">
          <label htmlFor="au-phone">Mobile number</label>
          <input id="au-phone" className="input" type="tel" autoComplete="tel" placeholder="03XX XXXXXXX" required value={form.phone} onChange={set('phone')} aria-invalid={!!errors.phone} />
          {errors.phone && <span className="error">{errors.phone}</span>}
        </div>
      )}
      <div className="field">
        <label htmlFor="au-password">Password</label>
        <input id="au-password" className="input" type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} required minLength={isRegister ? 8 : 1} value={form.password} onChange={set('password')} aria-invalid={!!errors.password} />
        {errors.password ? <span className="error">{errors.password}</span> : isRegister && <span className="hint">At least 8 characters.</span>}
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="btn btn--primary btn--block btn--lg" disabled={busy}>
        {busy ? 'Please wait…' : isRegister ? 'Create Account' : 'Log In'}
      </button>
      <p className="auth-alt">
        {isRegister ? (
          <>Already have an account? <Link className="link" href={`/login${next ? `?next=${encodeURIComponent(next)}` : ''}`}>Log in</Link></>
        ) : (
          <>New to PunjabShop? <Link className="link" href={`/register${next ? `?next=${encodeURIComponent(next)}` : ''}`}>Create an account</Link></>
        )}
      </p>
    </form>
  );
}
