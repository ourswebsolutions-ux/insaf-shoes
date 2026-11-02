import ContentPage from '@/components/store/content/ContentPage';
import { formatPrice } from '@/lib/format';
import { getSettings } from '@/lib/settings';

export const metadata = { title: 'Shipping Policy' };

export default async function ShippingPolicyPage() {
  const { shipping } = await getSettings();
  const cityFees = Object.entries(shipping.city_fees || {});
  return (
    <ContentPage title="Shipping Policy" intro="Delivery all over Pakistan.">
      <div className="prose">
        <h2>Delivery time</h2>
        <p>Orders are dispatched within 1–2 working days and delivered within {shipping.estimated_days}.</p>
        <h2>Delivery charges</h2>
        <ul>
          <li>Standard delivery: {formatPrice(shipping.flat_fee)} per order.</li>
          {Number(shipping.free_threshold) > 0 && <li>FREE delivery on orders above {formatPrice(shipping.free_threshold)}.</li>}
          {Number(shipping.cod_fee) > 0 && <li>Cash on Delivery handling: {formatPrice(shipping.cod_fee)}.</li>}
          {cityFees.map(([city, fee]) => <li key={city}>{city}: {formatPrice(fee)}</li>)}
        </ul>
        <h2>Order tracking</h2>
        <p>Once shipped, you’ll receive the courier name and tracking number, which you can also see on the Track Order page.</p>
      </div>
    </ContentPage>
  );
}
