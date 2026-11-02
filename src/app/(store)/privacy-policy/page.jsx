import ContentPage from '@/components/store/content/ContentPage';
import { getSettings } from '@/lib/settings';

export const metadata = { title: 'Privacy Policy' };

export default async function PrivacyPage() {
  const { store } = await getSettings();
  return (
    <ContentPage title="Privacy Policy" intro="How we collect, use and protect your information.">
      <div className="prose">
        <p>This policy explains how {store.name} handles the personal information you share with us when you visit our website or place an order.</p>
        <h2>Information we collect</h2>
        <ul>
          <li>Contact details such as your name, mobile number, email address and delivery address.</li>
          <li>Order details including the products you purchase and your payment method.</li>
          <li>Account information if you register, including a securely hashed password.</li>
          <li>Basic technical data such as cookies required for your cart and login session.</li>
        </ul>
        <h2>How we use your information</h2>
        <ul>
          <li>To process, confirm, deliver and support your orders.</li>
          <li>To contact you about your order by phone, SMS, WhatsApp or email.</li>
          <li>To send offers and updates if you subscribe to our newsletter (you can unsubscribe at any time).</li>
          <li>To prevent fraud and keep our store secure.</li>
        </ul>
        <h2>Sharing</h2>
        <p>We share only what is necessary with courier companies to deliver your order and with payment providers (JazzCash, Easypaisa or banks) to process payments. We never sell your personal data.</p>
        <h2>Payments</h2>
        <p>Online payments are processed on the secure pages of the payment provider. We do not store your wallet PIN, card numbers or banking passwords.</p>
        <h2>Your choices</h2>
        <p>You can view and update your account details at any time, or contact us at {store.email} to request deletion of your data.</p>
        <h2>Contact</h2>
        <p>Questions about this policy? Email {store.email} or call {store.phone}.</p>
      </div>
    </ContentPage>
  );
}
