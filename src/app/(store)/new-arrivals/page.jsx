import ProductListing from '@/components/store/listing/ProductListing';

export const metadata = { title: 'New Arrivals', description: 'The latest footwear styles just landed at Insaf Shoes.', alternates: { canonical: '/new-arrivals' } };

export default async function NewArrivalsPage({ searchParams }) {
  const sp = await searchParams;
  return (
    <ProductListing
      title="New Arrivals"
      description="Fresh styles just in – be the first to wear them."
      crumbs={[{ label: 'New Arrivals' }]}
      base={{ flag: 'new_arrival' }}
      searchParams={sp}
      basePath="/new-arrivals"
    />
  );
}
