import Link from 'next/link';
import { redirect } from 'next/navigation';
import Icon from '@/components/Icon';
import ProductGrid from '@/components/store/ProductGrid';
import { getCustomer } from '@/lib/auth';
import { getProductsByIds } from '@/lib/catalog';
import { query } from '@/lib/db';

export const metadata = { title: 'My Wishlist', robots: { index: false } };

export default async function WishlistPage() {
  const customer = await getCustomer();
  if (!customer) redirect('/login?next=/wishlist');
  const rows = await query('SELECT product_id FROM wishlist WHERE customer_id = ? ORDER BY created_at DESC', [customer.id]);
  const products = await getProductsByIds(rows.map((r) => r.product_id));
  return (
    <>
      <section className="page-head">
        <div className="container page-head__inner">
          <h1>My Wishlist</h1>
          <p>{products.length} saved {products.length === 1 ? 'item' : 'items'}</p>
        </div>
      </section>
      <div className="container content-page">
        {products.length ? (
          <ProductGrid products={products} className="product-grid" />
        ) : (
          <div className="empty">
            <Icon name="heart" size={48} />
            <h2>Your wishlist is empty</h2>
            <p>Tap the heart on any product to save it for later.</p>
            <Link href="/shop" className="btn btn--primary">Explore products</Link>
          </div>
        )}
      </div>
    </>
  );
}
