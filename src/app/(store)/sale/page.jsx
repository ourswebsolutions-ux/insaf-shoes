import ProductListing from '@/components/store/listing/ProductListing';

export const metadata = { title: 'Sale', description: 'Shop discounted shoes, sneakers, heels and sandals. Limited-time offers at PunjabShop.', alternates: { canonical: '/sale' } };

export default async function SalePage({ searchParams }) {
  const sp = await searchParams;
  return (
    <ProductListing
      title="Sale"
      description="Great footwear at even better prices. Grab them before they’re gone."
      crumbs={[{ label: 'Sale' }]}
      base={{ onSale: true }}
      searchParams={{ sort: 'price_asc', ...sp }}
      basePath="/sale"
    />
  );
}
