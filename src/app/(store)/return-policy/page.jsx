import ContentPage from '@/components/store/content/ContentPage';
import { getSettings } from '@/lib/settings';

export const metadata = { title: 'Return & Refund Policy' };

export default async function ReturnPolicyPage() {
  const { store } = await getSettings();
  return (
    <ContentPage title="Return & Refund Policy" intro="Easy 7-day exchanges and returns.">
      <div className="prose">
        <h2>Eligibility</h2>
        <ul>
          <li>Requests must be made within 7 days of delivery.</li>
          <li>Items must be unworn, clean and in original packaging with tags.</li>
          <li>Sale items can be exchanged for size but are not eligible for cash refunds unless defective.</li>
        </ul>
        <h2>How to request</h2>
        <p>Message us on WhatsApp ({store.whatsapp}) or email {store.email} with your order number, the item and the reason. We’ll arrange a pickup or share the return address.</p>
        <h2>Exchanges</h2>
        <p>Size exchanges are free the first time. We ship the replacement as soon as the returned item is received and checked.</p>
        <h2>Refunds</h2>
        <p>Approved refunds are issued within 5–7 working days via bank transfer, JazzCash or Easypaisa. Original delivery charges are non-refundable unless the item was defective or incorrect.</p>
        <h2>Damaged or wrong items</h2>
        <p>If you receive a damaged or incorrect item, contact us within 48 hours with photos and we’ll replace it at no cost.</p>
      </div>
    </ContentPage>
  );
}
