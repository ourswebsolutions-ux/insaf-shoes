import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { LogoMark } from '@/components/Logo';
import { getAdmin } from '@/lib/auth';
import LoginForm from './LoginForm';

export const metadata = { title: 'Admin Login' };

export default async function AdminLoginPage() {
  if (await getAdmin()) redirect('/admin');
  return (
    <div className="admin-login">
      <div className="panel">
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'inline-block' }}><LogoMark size={88} /></div>
          <h1 style={{ fontSize: 24, marginTop: 8 }}>Insaf Shoes Admin</h1>
          <p className="muted" style={{ fontSize: 14 }}>Sign in to manage your store</p>
        </div>
        <Suspense><LoginForm /></Suspense>
      </div>
    </div>
  );
}
