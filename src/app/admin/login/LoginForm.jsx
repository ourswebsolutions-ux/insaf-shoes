'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/client-api';

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const next = params.get('next');
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        try {
          await api('/api/admin/auth/login', { method: 'POST', body: form });
          router.push(next && next.startsWith('/admin') ? next : '/admin');
          router.refresh();
        } catch (err) {
          setError(err.message);
          setBusy(false);
        }
      }}
    >
      <div className="field">
        <label htmlFor="ad-email">Email</label>
        <input id="ad-email" className="input" type="email" autoComplete="username" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      </div>
      <div className="field">
        <label htmlFor="ad-pw">Password</label>
        <input id="ad-pw" className="input" type="password" autoComplete="current-password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
      </div>
      {error && <p className="form-error">{error}</p>}
      <button className="btn btn--primary btn--block btn--lg" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
    </form>
  );
}
