import Link from 'next/link';
import Logo from '@/components/Logo';

export const metadata = { title: 'Page not found' };

export default function NotFound() {
  return (
    <div className="notfound">
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 30 }}><Logo /></div>
      <b>404</b>
      <h1>This page walked away</h1>
      <p>The page you’re looking for doesn’t exist or has been moved.</p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link href="/" className="btn btn--primary">Back to Home</Link>
        <Link href="/shop" className="btn btn--outline">Browse Products</Link>
      </div>
    </div>
  );
}
