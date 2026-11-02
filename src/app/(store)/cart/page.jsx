import Link from 'next/link';
import Icon from '@/components/Icon';
import CartView from '@/components/store/cart/CartView';

export const metadata = { title: 'Shopping Cart', robots: { index: false } };

export default function CartPage() {
  return (
    <div className="container">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <Icon name="chevronRight" size={14} />
        <span>Cart</span>
      </nav>
      <CartView />
    </div>
  );
}
