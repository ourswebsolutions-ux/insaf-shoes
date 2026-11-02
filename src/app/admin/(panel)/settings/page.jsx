import { PaymentSettingsForm, ShippingSettingsForm, StoreSettingsForm } from '@/components/admin/SettingsForms';
import { pageAdmin } from '@/lib/admin';
import { siteUrl } from '@/lib/payments';
import { getSettings } from '@/lib/settings';

export const metadata = { title: 'Store Settings' };

export default async function SettingsAdmin() {
  await pageAdmin('settings');
  const { store, topbar, shipping, payments } = await getSettings();
  // Never send stored payment secrets back to the browser.
  const masked = structuredClone(payments);
  masked.jazzcash.password = '';
  masked.jazzcash.integrity_salt = '';
  masked.easypaisa.hash_key = '';
  const secrets = {
    jazzcash_password: !!payments.jazzcash.password,
    jazzcash_salt: !!payments.jazzcash.integrity_salt,
    easypaisa_key: !!payments.easypaisa.hash_key,
  };
  return (
    <>
      <div className="page-bar">
        <div><h1>Store Settings</h1><p>Your shop’s contact details, delivery charges and payment options.</p></div>
      </div>
      <nav className="tabs-nav">
        <a href="#shop">Shop details</a>
        <a href="#delivery">Delivery charges</a>
        <a href="#payments">Payment options</a>
      </nav>
      <div id="shop" style={{ scrollMarginTop: 80 }}><StoreSettingsForm store={store} topbar={topbar} /></div>
      <div id="delivery" style={{ scrollMarginTop: 80 }}><ShippingSettingsForm shipping={shipping} /></div>
      <div id="payments" style={{ scrollMarginTop: 80 }}><PaymentSettingsForm payments={masked} secrets={secrets} callbackBase={siteUrl()} /></div>
    </>
  );
}
