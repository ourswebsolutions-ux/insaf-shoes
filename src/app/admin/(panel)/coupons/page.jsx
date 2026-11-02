import CouponManager from '@/components/admin/CouponManager';
import { pageAdmin } from '@/lib/admin';
import { query } from '@/lib/db';

export const metadata = { title: 'Discounts' };

export default async function CouponsAdmin() {
  await pageAdmin('marketing');
  const coupons = await query('SELECT * FROM coupons ORDER BY created_at DESC');
  return <CouponManager coupons={JSON.parse(JSON.stringify(coupons))} />;
}
