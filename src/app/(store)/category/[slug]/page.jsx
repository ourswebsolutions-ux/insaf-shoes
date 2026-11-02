import { notFound } from 'next/navigation';
import ProductListing from '@/components/store/listing/ProductListing';
import { getCategoryBySlug } from '@/lib/catalog';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const cat = await getCategoryBySlug(slug);
  if (!cat) return { title: 'Category not found' };
  return {
    title: cat.seo_title || `${cat.name} – Buy Online in Pakistan`,
    description: cat.seo_description || cat.description || `Shop ${cat.name} online at PunjabShop with Cash on Delivery all over Pakistan.`,
    alternates: { canonical: `/category/${cat.slug}` },
    openGraph: cat.image ? { images: [cat.image] } : undefined,
  };
}

export default async function CategoryPage({ params, searchParams }) {
  const { slug } = await params;
  const sp = await searchParams;
  const cat = await getCategoryBySlug(slug);
  if (!cat) notFound();

  const crumbs = [];
  if (cat.parent) crumbs.push({ label: cat.parent.name, href: `/category/${cat.parent.slug}` });
  crumbs.push({ label: cat.name });

  // Sub-category chips (or sibling chips when viewing a sub-category).
  const chipSource = cat.children.length ? cat : cat.parent ? await getCategoryBySlug(cat.parent.slug) : null;
  const chips = chipSource
    ? [
        { label: 'All', href: `/category/${chipSource.slug}`, active: chipSource.id === cat.id },
        ...chipSource.children.map((c) => ({ label: c.name, href: `/category/${c.slug}`, active: c.id === cat.id })),
      ]
    : [];

  return (
    <ProductListing
      title={cat.name}
      description={cat.description}
      crumbs={crumbs}
      chips={chips}
      base={{ categoryIds: [cat.id] }}
      activeCategoryId={cat.id}
      searchParams={sp}
      basePath={`/category/${cat.slug}`}
    />
  );
}
