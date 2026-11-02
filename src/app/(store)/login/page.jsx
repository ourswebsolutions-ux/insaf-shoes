import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import AuthForm from '@/components/store/account/AuthForm';
import { getCustomer } from '@/lib/auth';

export const metadata = { title: 'Log In', robots: { index: false } };

export default async function LoginPage() {
  if (await getCustomer()) redirect('/account');
  return (
    <div className="auth-wrap">
      <div className="panel auth-card">
        <h1>Welcome back</h1>
        <p>Log in to track orders, save your wishlist and check out faster.</p>
        <Suspense><AuthForm mode="login" /></Suspense>
      </div>
    </div>
  );
}
