'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Icon from '@/components/Icon';
import { api, useShop } from '../ShopProvider';

const LINKS = [
  { href: '/account', label: 'Dashboard', icon: 'grid' },
  { href: '/account/orders', label: 'My Orders', icon: 'package' },
  { href: '/wishlist', label: 'Wishlist', icon: 'heart' },
  { href: '/account/addresses', label: 'Addresses', icon: 'pin' },
  { href: '/track-order', label: 'Track Order', icon: 'truck' },
];

export default function AccountNav({ customer }) {
  const pathname = usePathname();
  const router = useRouter();
  const { setCustomer, refreshCart } = useShop();
  return (
    <aside className="panel account-nav">
      <div className="account-user">
        <b>{customer.name}</b>
        <small>{customer.email}</small>
      </div>
      {LINKS.map((l) => (
        <Link key={l.href} href={l.href} className={pathname === l.href ? 'is-active' : ''}>
          <Icon name={l.icon} size={18} /> {l.label}
        </Link>
      ))}
      <button
        onClick={async () => {
          await api('/api/auth/logout', { method: 'POST' });
          setCustomer(null);
          await refreshCart();
          router.push('/');
          router.refresh();
        }}
      >
        <Icon name="logout" size={18} /> Log out
      </button>
    </aside>
  );
}
