import Icon from '@/components/Icon';
import ContentPage from '@/components/store/content/ContentPage';
import { formatPrice } from '@/lib/format';
import { getSettings } from '@/lib/settings';

export const metadata = { title: 'FAQ', description: 'Answers to common questions about orders, delivery, payments and returns at PunjabShop.' };

export default async function FaqPage() {
  const { shipping, store } = await getSettings();
  const faqs = [
    ['How long does delivery take?', `Orders are delivered all over Pakistan within ${shipping.estimated_days}. Major cities usually receive orders sooner.`],
    ['How much is the delivery charge?', `Delivery is ${formatPrice(shipping.flat_fee)} per order${Number(shipping.free_threshold) > 0 ? ` and FREE on orders above ${formatPrice(shipping.free_threshold)}` : ''}.`],
    ['Do you offer Cash on Delivery?', 'Yes! Cash on Delivery is available in all cities. You pay the rider when you receive your parcel.'],
    ['Which online payment methods do you accept?', 'Depending on availability you can pay with JazzCash, Easypaisa or direct bank transfer. Online payments are confirmed only after they are verified.'],
    ['How do I choose the right size?', 'Our sizes are in EU numbering. If you are between sizes we recommend going one size up. You can also message us on WhatsApp for help.'],
    ['Can I exchange or return my shoes?', 'Yes, unworn items in original packaging can be exchanged or returned within 7 days of delivery. See our Return & Refund Policy for details.'],
    ['How can I track my order?', 'Use the Track Order page with your order number and mobile number, or log in to your account to see all your orders.'],
    ['Can I cancel my order?', `You can cancel any time before it is shipped by contacting us on WhatsApp (${store.whatsapp}) or phone.`],
  ];
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  };
  return (
    <ContentPage title="Frequently Asked Questions" intro="Quick answers to the questions we hear most.">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="faq">
        {faqs.map(([q, a], i) => (
          <details key={i} open={i === 0}>
            <summary>{q}<Icon name="chevronDown" size={18} /></summary>
            <div>{a}</div>
          </details>
        ))}
      </div>
    </ContentPage>
  );
}
