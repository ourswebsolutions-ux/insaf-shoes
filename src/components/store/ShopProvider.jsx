'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Icon from '@/components/Icon';
import QuickAdd from './QuickAdd';
import { api } from '@/lib/client-api';

const ShopContext = createContext(null);

export function useShop() {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error('useShop must be used inside <ShopProvider>');
  return ctx;
}

export { api };

export default function ShopProvider({ customer: initialCustomer, children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [customer, setCustomer] = useState(initialCustomer);
  const [cart, setCart] = useState(null);
  const [wishlist, setWishlist] = useState(() => new Set());
  const [toasts, setToasts] = useState([]);
  const [quickAdd, setQuickAdd] = useState(null);
  const toastId = useRef(0);

  useEffect(() => setCustomer(initialCustomer), [initialCustomer]);

  const toast = useCallback((message, { type = 'success', link } = {}) => {
    const id = ++toastId.current;
    setToasts((t) => [...t.slice(-2), { id, message, type, link }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  }, []);

  const refreshCart = useCallback(async () => {
    try {
      setCart(await api('/api/cart'));
    } catch {
      /* cart stays as-is */
    }
  }, []);

  useEffect(() => {
    refreshCart();
  }, [refreshCart, customer?.id]);

  useEffect(() => {
    if (!customer) return setWishlist(new Set());
    api('/api/wishlist?ids=1')
      .then((d) => setWishlist(new Set(d.ids)))
      .catch(() => {});
  }, [customer]);

  const addToCart = useCallback(
    async (productId, variantId, quantity = 1, { silent = false } = {}) => {
      const data = await api('/api/cart', { method: 'POST', body: { product_id: productId, variant_id: variantId, quantity } });
      setCart(data);
      if (!silent) toast('Added to your cart.', { link: { href: '/cart', label: 'View cart' } });
      return data;
    },
    [toast]
  );

  const updateLine = useCallback(async (itemId, quantity) => {
    setCart(await api('/api/cart', { method: 'PATCH', body: { item_id: itemId, quantity } }));
  }, []);

  const removeLine = useCallback(async (itemId) => {
    setCart(await api('/api/cart', { method: 'DELETE', body: { item_id: itemId } }));
  }, []);

  const applyCoupon = useCallback(async (code) => {
    setCart(await api('/api/cart/coupon', { method: 'POST', body: { code } }));
  }, []);

  const removeCoupon = useCallback(async () => {
    setCart(await api('/api/cart/coupon', { method: 'DELETE' }));
  }, []);

  const toggleWishlist = useCallback(
    async (productId) => {
      if (!customer) {
        toast('Please log in to save items to your wishlist.', { type: 'error' });
        router.push(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }
      const on = wishlist.has(productId);
      setWishlist((s) => {
        const n = new Set(s);
        on ? n.delete(productId) : n.add(productId);
        return n;
      });
      try {
        await api('/api/wishlist', { method: on ? 'DELETE' : 'POST', body: { product_id: productId } });
        if (!on) toast('Saved to your wishlist.', { link: { href: '/wishlist', label: 'View wishlist' } });
      } catch (e) {
        setWishlist((s) => {
          const n = new Set(s);
          on ? n.add(productId) : n.delete(productId);
          return n;
        });
        toast(e.message, { type: 'error' });
      }
    },
    [customer, wishlist, toast, router, pathname]
  );

  const value = useMemo(
    () => ({
      customer,
      setCustomer,
      cart,
      cartCount: cart?.count || 0,
      refreshCart,
      addToCart,
      updateLine,
      removeLine,
      applyCoupon,
      removeCoupon,
      wishlist,
      toggleWishlist,
      toast,
      openQuickAdd: setQuickAdd,
    }),
    [customer, cart, refreshCart, addToCart, updateLine, removeLine, applyCoupon, removeCoupon, wishlist, toggleWishlist, toast]
  );

  return (
    <ShopContext.Provider value={value}>
      {children}
      {quickAdd && <QuickAdd product={quickAdd} onClose={() => setQuickAdd(null)} />}
      <div className="toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.type}`} role="status">
            <Icon name={t.type === 'error' ? 'alert' : 'check'} className="toast__icon" />
            <div>
              {t.message}{' '}
              {t.link && (
                <Link href={t.link.href} onClick={() => setToasts([])}>
                  {t.link.label}
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </ShopContext.Provider>
  );
}
