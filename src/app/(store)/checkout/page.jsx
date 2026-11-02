import Link from 'next/link';
import Icon from '@/components/Icon';
import CheckoutForm from '@/components/store/checkout/CheckoutForm';
import { getCustomer } from '@/lib/auth';
import { query } from '@/lib/db';
import { getSettings, publicPaymentOptions } from '@/lib/settings';

export const metadata = { title: 'Checkout', robots: { index: false } };

export default async function CheckoutPage() {
  const [settings, customer] = await Promise.all([getSettings(), getCustomer()]);
  const addresses = customer
    ? await query('SELECT id, name, phone, address, city, province, postal_code, is_default FROM addresses WHERE customer_id = ? ORDER BY is_default DESC, id DESC', [customer.id])
    : [];
  const { flat_fee, free_threshold, city_fees, cod_fee } = settings.shipping;

  return (
    <div className="container">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <Icon name="chevronRight" size={14} />
        <Link href="/cart">Cart</Link>
        <Icon name="chevronRight" size={14} />
        <span>Checkout</span>
      </nav>
      <CheckoutForm
        methods={publicPaymentOptions(settings)}
        shipping={{ flat_fee, free_threshold, city_fees, cod_fee }}
        addresses={addresses.map((a) => ({ ...a, is_default: !!a.is_default }))}
        customer={customer ? { name: customer.name, email: customer.email, phone: customer.phone } : null}
      />
    </div>
  );
}
