'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Icon from '@/components/Icon';
import Logo from '@/components/Logo';
import { api } from '@/lib/client-api';

export default function AdminShell({ admin, nav, canAddProduct, children }) {
  const pathname = usePathname();
  const router = useRouter();
  const main = useRef(null);
  const [open, setOpen] = useState(false);

  // Only the main area scrolls, so reset it (not the window) on every page change.
  useEffect(() => {
    setOpen(false);
    main.current?.scrollTo(0, 0);
  }, [pathname]);

  const isActive = (href) => (href === '/admin' ? pathname === '/admin' : pathname === href || pathname.startsWith(`${href}/`));
  const all = nav.flatMap((g) => g.items);
  const current = [...all].sort((a, b) => b.href.length - a.href.length).find((i) => isActive(i.href));

  async function logout() {
    await api('/api/admin/auth/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  }

  return (
    <div className="admin">
      <div className={`drawer-backdrop ${open ? 'is-open' : ''}`} style={{ zIndex: 35 }} onClick={() => setOpen(false)} />
      <aside className={`admin-side ${open ? 'is-open' : ''}`} onClick={(e) => e.target.closest('a') && setOpen(false)}>
        <div className="admin-side__brand">
          <Logo variant="light" href="/admin" tagline={null} />
          <small>Shop Admin</small>
        </div>
        <nav className="admin-nav" aria-label="Admin">
          {canAddProduct && (
            <Link href="/admin/products/new" className="admin-nav__primary">
              <Icon name="plus" size={18} /> Add Product
            </Link>
          )}
          {nav.map((g) => (
            <div key={g.label}>
              {g.label && <div className="admin-nav__label">{g.label}</div>}
              {g.items.map((i) => (
                <Link key={i.href} href={i.href} className={current?.href === i.href ? 'is-active' : ''}>
                  <Icon name={i.icon} size={18} /> {i.label}
                  {i.count > 0 && <span className="count">{i.count}</span>}
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <div className="admin-side__foot">
          <div className="admin-side__user">
            <span className="admin-top__avatar">{admin.name.slice(0, 1).toUpperCase()}</span>
            <span>
              <b>{admin.name}</b>
              {admin.email}
            </span>
          </div>
          <Link href="/admin/profile" className={pathname === '/admin/profile' ? 'is-active' : ''}>
            <Icon name="user" size={18} /> My Account
          </Link>
          <a href="/" target="_blank" rel="noopener">
            <Icon name="external" size={18} /> Open My Website
          </a>
          <button onClick={logout}>
            <Icon name="logout" size={18} /> Log Out
          </button>
        </div>
      </aside>
      <div className="admin-main" ref={main}>
        <header className="admin-top">
          <button className="icon-btn admin-menu-btn" onClick={() => setOpen(true)} aria-label="Open menu">
            <Icon name="menu" size={20} />
          </button>
          <span className="admin-top__title">{pathname === '/admin/profile' ? 'My Account' : current?.label || 'Admin'}</span>
          <Link href="/admin/profile" className="admin-top__user" aria-label="My account">
            <span className="admin-top__avatar">{admin.name.slice(0, 1).toUpperCase()}</span>
          </Link>
        </header>
        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}
