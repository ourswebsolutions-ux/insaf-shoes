import ContentPage from '@/components/store/content/ContentPage';
import { getSettings } from '@/lib/settings';

export const metadata = { title: 'Terms & Conditions' };

export default async function TermsPage() {
  const { store } = await getSettings();
  return (
    <ContentPage title="Terms & Conditions" intro={`Please read these terms carefully before using ${store.name}.`}>
      <div className="prose">
        <h2>Orders</h2>
        <p>All orders are subject to availability and confirmation. We may call you to verify Cash on Delivery orders before dispatch. We reserve the right to cancel orders that cannot be verified or that contain pricing errors.</p>
        <h2>Pricing</h2>
        <p>All prices are in Pakistani Rupees (PKR) and include applicable taxes. Delivery charges are shown at checkout. Prices and promotions may change without notice but will not affect orders already confirmed.</p>
        <h2>Payments</h2>
        <p>We accept Cash on Delivery and, where enabled, JazzCash, Easypaisa and bank transfer. Online payments are considered complete only once verified by us or the payment provider.</p>
        <h2>Delivery</h2>
        <p>Delivery timelines are estimates. Please inspect your parcel on delivery and contact us within 48 hours about any damage or missing items.</p>
        <h2>Returns</h2>
        <p>Returns and exchanges are governed by our Return &amp; Refund Policy.</p>
        <h2>Accounts</h2>
        <p>You are responsible for keeping your login details confidential. We may suspend accounts involved in fraud or abuse.</p>
        <h2>Contact</h2>
        <p>For any questions, contact {store.email} or {store.phone}.</p>
      </div>
    </ContentPage>
  );
}
