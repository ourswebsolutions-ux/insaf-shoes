import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import AuthForm from '@/components/store/account/AuthForm';
import { getCustomer } from '@/lib/auth';

export const metadata = { title: 'Create Account', robots: { index: false } };

export default async function RegisterPage() {
  if (await getCustomer()) redirect('/account');
  return (
    <div className="auth-wrap">
      <div className="panel auth-card">
        <h1>Create your account</h1>
        <p>Join PunjabShop for faster checkout and easy order tracking.</p>
        <Suspense><AuthForm mode="register" /></Suspense>
      </div>
    </div>
  );
}
