import { Suspense } from 'react';
import Icon from '@/components/Icon';
import Header from '@/components/store/Header';
import TopBar from '@/components/store/TopBar';
import Footer from '@/components/store/Footer';
import Newsletter from '@/components/store/Newsletter';
import ShopProvider from '@/components/store/ShopProvider';
import { getCustomer } from '@/lib/auth';
import { getMenuCategories } from '@/lib/catalog';
import { whatsappLink } from '@/lib/pakistan';
import { getSettings } from '@/lib/settings';

export default async function StoreLayout({ children }) {
  const [settings, menu, customer] = await Promise.all([getSettings(), getMenuCategories(), getCustomer()]);
  const { store, topbar, homepage } = settings;
  const menuLite = menu.map((c) => ({
    id: c.id,
    name: c.name,
    menu_label: c.menu_label,
    slug: c.slug,
    children: c.children.map((s) => ({ id: s.id, name: s.name, slug: s.slug })),
  }));
  const storeLite = { name: store.name, tagline: store.tagline, phone: store.phone, email: store.email };

  return (
    <ShopProvider customer={customer ? { id: customer.id, name: customer.name, email: customer.email } : null}>
      <TopBar topbar={topbar} />
      <Suspense fallback={<div className="header" style={{ height: 'var(--header-h)' }} />}>
        <Header menu={menuLite} store={storeLite} />
      </Suspense>
      <main id="main">{children}</main>
      {homepage.sections.newsletter && <Newsletter title={homepage.newsletter_title} text={homepage.newsletter_text} social={store.social} />}
      <Footer store={store} menu={menuLite} />
      {store.whatsapp && (
        <a className="wa-float" href={whatsappLink(store.whatsapp, `Assalam o Alaikum ${store.name}, I need help with`)} target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp">
          <Icon name="whatsapp" size={28} />
        </a>
      )}
    </ShopProvider>
  );
}
