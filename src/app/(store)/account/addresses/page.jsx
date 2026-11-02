import AddressBook from '@/components/store/account/AddressBook';
import { getCustomer } from '@/lib/auth';
import { query } from '@/lib/db';

export const metadata = { title: 'My Addresses', robots: { index: false } };

export default async function AddressesPage() {
  const customer = await getCustomer();
  const addresses = await query('SELECT * FROM addresses WHERE customer_id = ? ORDER BY is_default DESC, id DESC', [customer.id]);
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <h1 style={{ fontSize: 24 }}>Saved Addresses</h1>
      <AddressBook addresses={JSON.parse(JSON.stringify(addresses))} />
    </div>
  );
}
