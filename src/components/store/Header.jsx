'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Icon from '@/components/Icon';
import Logo from '@/components/Logo';
import { useShop } from './ShopProvider';

function SearchBox({ onDone }) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get('q') || '');
  return (
    <form
      className="search"
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        const term = q.trim();
        router.push(term ? `/shop?q=${encodeURIComponent(term)}` : '/shop');
        onDone?.();
      }}
    >
      <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search for shoes..." aria-label="Search products" />
      <button type="submit" aria-label="Search">
        <Icon name="search" size={20} />
      </button>
    </form>
  );
}

export default function Header({ menu, store }) {
  const pathname = usePathname();
  const { cartCount, customer } = useShop();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const isActive = (href) => (href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`));
  const links = [
    { href: '/', label: 'Home' },
    ...menu.map((c) => ({ href: `/category/${c.slug}`, label: c.menu_label || c.name, children: c.children })),
    { href: '/new-arrivals', label: 'New Arrivals' },
    { href: '/sale', label: 'Sale' },
  ];

  return (
    <>
      <header className={`header ${scrolled ? 'is-scrolled' : ''}`}>
        <div className="container header__inner">
          <button className="icon-btn menu-toggle" onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open}>
            <Icon name="menu" size={20} />
          </button>
          <Logo name={store.name} tagline={store.tagline} />
          <nav className="nav" aria-label="Main">
            {links.map((l) => (
              <div className="nav__item" key={l.href}>
                <Link href={l.href} className={`nav__link ${isActive(l.href) ? 'is-active' : ''}`}>
                  {l.label}
                  {l.children?.length > 0 && <Icon name="chevronDown" size={14} strokeWidth={2.4} />}
                </Link>
                {l.children?.length > 0 && (
                  <div className="nav__dropdown">
                    {l.children.map((c) => (
                      <Link key={c.id} href={`/category/${c.slug}`}>
                        {c.name}
                      </Link>
                    ))}
                    <Link href={l.href} className="all">
                      View all {l.label}
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </nav>
          <div className="header__search">
            <SearchBox />
          </div>
          <div className="header__actions">
            <Link href={customer ? '/account' : '/login'} className="icon-btn" aria-label={customer ? 'My account' : 'Log in'}>
              <Icon name="user" size={20} />
            </Link>
            <Link href="/cart" className="icon-btn" aria-label={`Cart, ${cartCount} items`}>
              <Icon name="cart" size={21} />
              <span className="icon-btn__badge">{cartCount}</span>
            </Link>
          </div>
        </div>
      </header>

      <div className={`drawer-backdrop ${open ? 'is-open' : ''}`} onClick={() => setOpen(false)} />
      <aside className={`drawer ${open ? 'is-open' : ''}`} aria-hidden={!open} aria-label="Menu">
        <div className="drawer__head">
          <Logo name={store.name} tagline={null} />
          <button className="icon-btn" onClick={() => setOpen(false)} aria-label="Close menu">
            <Icon name="x" size={20} />
          </button>
        </div>
        <div className="drawer__search">
          <SearchBox onDone={() => setOpen(false)} />
        </div>
        <nav className="drawer__nav">
          {links.map((l) =>
            l.children?.length ? (
              <div key={l.href}>
                <button className={`drawer__link ${isActive(l.href) ? 'is-active' : ''}`} onClick={() => setExpanded(expanded === l.href ? null : l.href)} aria-expanded={expanded === l.href}>
                  {l.label}
                  <Icon name="chevronDown" size={16} style={{ transform: expanded === l.href ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
                </button>
                <div className={`drawer__sub ${expanded === l.href ? 'is-open' : ''}`}>
                  <Link href={l.href}>All {l.label}</Link>
                  {l.children.map((c) => (
                    <Link key={c.id} href={`/category/${c.slug}`}>
                      {c.name}
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <Link key={l.href} href={l.href} className={`drawer__link ${isActive(l.href) ? 'is-active' : ''}`}>
                {l.label}
              </Link>
            )
          )}
          <Link href="/wishlist" className="drawer__link">Wishlist</Link>
          <Link href="/track-order" className="drawer__link">Track Order</Link>
          <Link href={customer ? '/account' : '/login'} className="drawer__link">{customer ? 'My Account' : 'Login / Register'}</Link>
        </nav>
        <div className="drawer__foot">
          <a href={`tel:${store.phone.replace(/\s/g, '')}`}>
            <Icon name="phone" size={18} /> {store.phone}
          </a>
          <a href={`mailto:${store.email}`}>
            <Icon name="mail" size={18} /> {store.email}
          </a>
        </div>
      </aside>
    </>
  );
}
