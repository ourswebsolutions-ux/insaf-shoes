import { redirect } from 'next/navigation';

export default function ShippingRedirect() {
  redirect('/admin/settings#delivery');
}
