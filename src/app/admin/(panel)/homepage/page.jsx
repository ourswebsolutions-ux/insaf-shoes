import BannerManager from '@/components/admin/BannerManager';
import HomepageManager from '@/components/admin/HomepageManager';
import Icon from '@/components/Icon';
import { pageAdmin } from '@/lib/admin';
import { prisma, query } from '@/lib/db';
import { getSettings } from '@/lib/settings';

export const metadata = { title: 'Homepage' };

export default async function HomepageAdmin() {
  await pageAdmin('content');
  const [{ homepage }, products, categories, testimonials, banners] = await Promise.all([
    getSettings(),
    query("SELECT p.id, p.name, (SELECT url FROM product_images WHERE product_id = p.id ORDER BY sort_order LIMIT 1) AS image FROM products p WHERE status = 'active' ORDER BY name"),
    prisma.category.findMany({ where: { status: 'active' }, orderBy: [{ sort_order: 'asc' }, { name: 'asc' }], select: { id: true, name: true, image: true, sort_order: true, show_on_home: true } }),
    prisma.testimonial.findMany({ orderBy: [{ sort_order: 'asc' }, { id: 'asc' }] }),
    prisma.banner.findMany({ orderBy: [{ placement: 'asc' }, { sort_order: 'asc' }, { id: 'asc' }] }),
  ]);
  return (
    <>
      <div className="page-bar">
        <div>
          <h1>Homepage</h1>
          <p>Change the big pictures at the top, choose which sections show, and pick the products customers see first.</p>
        </div>
        <div className="page-bar__actions">
          <a href="/" target="_blank" className="btn btn--outline btn--sm"><Icon name="eye" size={16} /> See homepage</a>
        </div>
      </div>
      <nav className="tabs-nav">
        <a href="#banners">Big pictures (banners)</a>
        <a href="#sections">Sections &amp; products</a>
        <a href="#categories">Category order</a>
        <a href="#reviews">Customer reviews</a>
      </nav>
      <div id="banners" style={{ display: 'grid', gap: 20, scrollMarginTop: 80 }}>
        <BannerManager banners={JSON.parse(JSON.stringify(banners)).map((b) => Object.fromEntries(Object.entries(b).map(([k, v]) => [k, v ?? ''])))} embedded />
      </div>
      <HomepageManager
        homepage={homepage}
        products={products}
        categories={categories}
        testimonials={JSON.parse(JSON.stringify(testimonials))}
      />
    </>
  );
}
