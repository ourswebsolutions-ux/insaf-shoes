import ProductListing from '@/components/store/listing/ProductListing';

export const metadata = {
  title: 'Shop All Footwear',
  description: 'Browse all shoes, sneakers, heels, sandals and chappals at PunjabShop. Cash on Delivery all over Pakistan.',
  alternates: { canonical: '/shop' },
};

export default async function ShopPage({ searchParams }) {
  const sp = await searchParams;
  return (
    <ProductListing
      title="All Products"
      description="Discover our complete collection of premium footwear for men, women and kids."
      crumbs={[{ label: 'Shop' }]}
      searchParams={sp}
      basePath="/shop"
    />
  );
}
