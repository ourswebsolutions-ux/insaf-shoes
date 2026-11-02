import Image from 'next/image';
import Link from 'next/link';
import Icon from '@/components/Icon';
import HeroSlider from '@/components/store/home/HeroSlider';
import Testimonials from '@/components/store/home/Testimonials';
import ProductGrid from '@/components/store/ProductGrid';
import SectionHeading from '@/components/store/SectionHeading';
import { getCategories, getProductsByIds, listProducts } from '@/lib/catalog';
import { query } from '@/lib/db';
import { getSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

const FEATURE_ICONS = { truck: 'truck', returns: 'returns', shield: 'shield', headset: 'headset', card: 'card', tag: 'tag', star: 'star', package: 'package' };

/** Admin-picked products first, then fill from the flag/sort query. */
async function pickProducts(ids, filters, limit) {
  const picked = await getProductsByIds(ids || []);
  if (picked.length >= limit) return picked.slice(0, limit);
  const seen = new Set(picked.map((p) => p.id));
  const { items } = await listProducts({ ...filters, limit: limit * 2 });
  const filled = [...picked, ...items.filter((p) => !seen.has(p.id))];
  if (filled.length >= limit || !filters.flag) return filled.slice(0, limit);
  const more = await listProducts({ sort: filters.sort, limit: limit * 2 });
  const seen2 = new Set(filled.map((p) => p.id));
  return [...filled, ...more.items.filter((p) => !seen2.has(p.id))].slice(0, limit);
}

export default async function HomePage() {
  const { homepage: hp, store } = await getSettings();
  const s = hp.sections;
  const [banners, categories, bestSellers, featured, newArrivals, testimonials] = await Promise.all([
    query("SELECT * FROM banners WHERE status = 'active' ORDER BY placement, sort_order, id"),
    getCategories(),
    s.best_sellers ? pickProducts(hp.best_seller_ids, { flag: 'best_seller', sort: 'best_selling' }, 10) : [],
    s.featured ? pickProducts(hp.featured_ids, { flag: 'featured', sort: 'popularity' }, 10) : [],
    s.new_arrivals ? listProducts({ flag: 'new_arrival', sort: 'newest', limit: 10 }).then((r) => r.items) : [],
    s.testimonials ? query("SELECT * FROM testimonials WHERE status = 'active' ORDER BY sort_order, id") : [],
  ]);
  const hero = banners.filter((b) => b.placement === 'hero');
  const promos = banners.filter((b) => b.placement === 'promo').slice(0, 2);
  const homeCats = categories.filter((c) => c.show_on_home).slice(0, 8);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'OnlineStore',
    name: store.name,
    url: process.env.NEXT_PUBLIC_SITE_URL,
    telephone: store.phone,
    email: store.email,
    address: { '@type': 'PostalAddress', addressLocality: store.address, addressCountry: 'PK' },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {s.hero && <HeroSlider slides={hero} />}

      {s.categories && homeCats.length > 0 && (
        <section className="section">
          <div className="container">
            <SectionHeading title={hp.categories_title} subtitle={hp.categories_subtitle} />
            <div className="cat-grid">
              {homeCats.map((c, i) => (
                <Link key={c.id} href={`/category/${c.slug}`} className="cat-card">
                  {c.image && <Image src={c.image} alt={c.name} fill sizes="(max-width: 900px) 50vw, 25vw" priority={i < 2} />}
                  <span className="cat-card__label">
                    {c.name} <Icon name="arrowRight" size={16} />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {s.best_sellers && bestSellers.length > 0 && (
        <section className="section" style={{ paddingTop: 8 }}>
          <div className="container">
            <SectionHeading
              title={hp.best_sellers_title}
              subtitle={hp.best_sellers_subtitle}
              action={
                <Link href="/shop?sort=best_selling" className="pill-link">
                  View All Products <Icon name="arrowRight" size={16} />
                </Link>
              }
            />
            <ProductGrid products={bestSellers} className="product-grid product-grid--home" />
          </div>
        </section>
      )}

      {s.promos && promos.length > 0 && (
        <section className="section" style={{ paddingTop: 8 }}>
          <div className="container promo-grid">
            {promos.map((p) => (
              <Link key={p.id} href={p.button_link || '/shop'} className={`promo promo--${p.theme}`}>
                <div className="promo__media">
                  <Image src={p.image} alt="" fill sizes="(max-width: 900px) 70vw, 40vw" />
                </div>
                <div className="promo__content">
                  <h3 className="promo__title">
                    {p.title}
                    {p.highlight && <em>{p.highlight}</em>}
                  </h3>
                  {p.subtitle && <p className="promo__sub">{p.subtitle}</p>}
                  {p.button_text && (
                    <span className={`btn btn--sm ${p.theme === 'dark' ? 'btn--white' : 'btn--primary'}`}>
                      {p.button_text} <Icon name="arrowRight" size={16} className="arrow" />
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {s.featured && featured.length > 0 && (
        <section className="section">
          <div className="container">
            <SectionHeading title={hp.featured_title} subtitle={hp.featured_subtitle} />
            <ProductGrid products={featured} className="product-grid product-grid--home" />
          </div>
        </section>
      )}

      {s.new_arrivals && newArrivals.length > 0 && (
        <section className="section">
          <div className="container">
            <SectionHeading
              title={hp.new_arrivals_title}
              subtitle={hp.new_arrivals_subtitle}
              action={
                <Link href="/new-arrivals" className="pill-link">
                  View All <Icon name="arrowRight" size={16} />
                </Link>
              }
            />
            <ProductGrid products={newArrivals} className="product-grid product-grid--home" />
          </div>
        </section>
      )}

      {s.features && hp.features?.length > 0 && (
        <section className="section" style={{ paddingTop: 12, paddingBottom: 12 }}>
          <div className="container">
            <SectionHeading title={hp.features_title} />
            <div className="features">
              {hp.features.map((f, i) => (
                <div className="feature" key={i}>
                  <Icon name={FEATURE_ICONS[f.icon] || 'check'} size={36} strokeWidth={1.7} className="feature__icon" />
                  <div>
                    <div className="feature__title">{f.title}</div>
                    <div className="feature__text">{f.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {s.testimonials && testimonials.length > 0 && (
        <section className="section" style={{ paddingTop: 16 }}>
          <div className="container">
            <SectionHeading title={hp.testimonials_title} />
            <Testimonials items={testimonials.map((t) => ({ id: t.id, name: t.name, quote: t.quote, avatar: t.avatar, rating: t.rating }))} />
          </div>
        </section>
      )}
    </>
  );
}
