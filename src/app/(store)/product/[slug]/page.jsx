import Link from 'next/link';
import { notFound } from 'next/navigation';
import Icon from '@/components/Icon';
import BuyBox from '@/components/store/product/BuyBox';
import Gallery from '@/components/store/product/Gallery';
import ProductTabs from '@/components/store/product/ProductTabs';
import ProductGrid from '@/components/store/ProductGrid';
import SectionHeading from '@/components/store/SectionHeading';
import Stars from '@/components/store/Stars';
import { getApprovedReviews, getProductBySlug, getRelatedProducts, sortSizes } from '@/lib/catalog';
import { query } from '@/lib/db';
import { effectivePrice, formatCount, formatPrice } from '@/lib/format';
import { getSettings } from '@/lib/settings';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return { title: 'Product not found' };
  const description = p.seo_description || p.short_description || `Buy ${p.name} online in Pakistan for ${formatPrice(effectivePrice(p))}.`;
  return {
    title: p.seo_title || p.name,
    description,
    alternates: { canonical: `/product/${p.slug}` },
    openGraph: { title: p.name, description, images: p.images.slice(0, 1).map((i) => i.url), type: 'website' },
  };
}

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [reviews, related, settings] = await Promise.all([getApprovedReviews(product.id), getRelatedProducts(product, 5), getSettings()]);
  // Raw update so a page view doesn't touch the product's updated_at timestamp.
  query('UPDATE products SET view_count = view_count + 1 WHERE id = ?', [product.id]).catch(() => {});

  const sizes = sortSizes([...new Set(product.variants.map((v) => v.size).filter(Boolean))]);
  const colors = [...new Set(product.variants.map((v) => v.color).filter(Boolean))];
  const inStock = product.variants.some((v) => v.stock > 0);
  const primaryCat = product.categories.find((c) => !c.parent_id) || product.categories[0];
  const subCat = product.categories.find((c) => c.parent_id);
  const ship = settings.shipping;
  const shippingText = `Delivery all over Pakistan in ${ship.estimated_days}. Flat delivery charge of ${formatPrice(ship.flat_fee)}${
    Number(ship.free_threshold) > 0 ? `, free on orders above ${formatPrice(ship.free_threshold)}` : ''
  }. Cash on Delivery available.`;

  const site = process.env.NEXT_PUBLIC_SITE_URL || '';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    sku: product.sku,
    description: product.short_description || product.description,
    image: product.images.map((i) => `${site}${i.url}`),
    brand: { '@type': 'Brand', name: settings.store.name },
    offers: {
      '@type': 'Offer',
      url: `${site}/product/${product.slug}`,
      priceCurrency: 'PKR',
      price: effectivePrice(product),
      availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
    ...(product.rating_count > 0 && {
      aggregateRating: { '@type': 'AggregateRating', ratingValue: Number(product.rating_avg).toFixed(1), reviewCount: product.rating_count },
    }),
  };

  return (
    <div className="container">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        {primaryCat && (
          <>
            <Icon name="chevronRight" size={14} />
            <Link href={`/category/${primaryCat.slug}`}>{primaryCat.name}</Link>
          </>
        )}
        {subCat && subCat.id !== primaryCat?.id && (
          <>
            <Icon name="chevronRight" size={14} />
            <Link href={`/category/${subCat.slug}`}>{subCat.name}</Link>
          </>
        )}
        <Icon name="chevronRight" size={14} />
        <span>{product.name}</span>
      </nav>

      <div className="pdp">
        <Gallery images={product.images} name={product.name} />
        <div className="buybox">
          {product.is_new_arrival ? <span className="badge badge--dark" style={{ marginBottom: 10 }}>New Arrival</span> : null}
          <h1>{product.name}</h1>
          <div className="buybox__meta">
            {product.rating_count > 0 && (
              <a href="#details" className="rating" style={{ marginTop: 0 }}>
                <Stars value={product.rating_avg} size={16} /> {Number(product.rating_avg).toFixed(1)} ({formatCount(product.rating_count)} reviews)
              </a>
            )}
            <span>SKU: {product.sku}</span>
            {product.sold_count > 0 && <span>{formatCount(product.sold_count)} sold</span>}
          </div>
          {product.short_description && <p className="buybox__short">{product.short_description}</p>}
          <BuyBox
            product={{ id: product.id, price: product.price, sale_price: product.sale_price, variants: product.variants }}
            lowStockThreshold={product.low_stock_threshold}
          />
          <div className="assurances">
            <div className="assurance"><Icon name="truck" size={22} /> Delivery in {ship.estimated_days}</div>
            <div className="assurance"><Icon name="cash" size={22} /> Cash on Delivery available</div>
            <div className="assurance"><Icon name="returns" size={22} /> Easy 7-day returns</div>
          </div>
          {product.categories.length > 0 && (
            <p className="buybox__cats">
              Categories:{' '}
              {product.categories.map((c, i) => (
                <span key={c.id}>
                  {i > 0 && ', '}
                  <Link href={`/category/${c.slug}`}>{c.name}</Link>
                </span>
              ))}
            </p>
          )}
        </div>
      </div>

      <ProductTabs
        product={{
          id: product.id,
          sku: product.sku,
          description: product.description,
          short_description: product.short_description,
          rating_avg: product.rating_avg,
          rating_count: product.rating_count,
          sizes,
          colors,
          shippingText,
        }}
        reviews={reviews.map((r) => ({ ...r, created_at: r.created_at.toISOString() }))}
      />

      {related.length > 0 && (
        <section className="section" style={{ paddingBottom: 48 }}>
          <SectionHeading title="You May Also Like" subtitle="Similar styles picked for you" />
          <ProductGrid products={related} className="product-grid product-grid--home" />
        </section>
      )}
    </div>
  );
}
