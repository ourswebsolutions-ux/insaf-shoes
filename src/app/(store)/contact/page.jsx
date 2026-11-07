import Icon from '@/components/Icon';
import ContactForm from '@/components/store/content/ContactForm';
import ContentPage from '@/components/store/content/ContentPage';
import { whatsappLink } from '@/lib/pakistan';
import { getSettings } from '@/lib/settings';

export const metadata = { title: 'Contact Us', description: 'Get in touch with Insaf Shoes by phone, WhatsApp or email.' };

export default async function ContactPage() {
  const { store } = await getSettings();
  return (
    <ContentPage title="Contact Us" intro="We’re here to help with orders, sizes, exchanges and anything else." narrow={false}>
      <div className="contact-grid">
        <div className="contact-cards">
          <a className="contact-card" href={whatsappLink(store.whatsapp)} target="_blank" rel="noopener noreferrer">
            <span className="contact-card__icon" style={{ background: '#25d366' }}><Icon name="whatsapp" size={22} /></span>
            <span><small>WhatsApp (fastest)</small><b>{store.whatsapp}</b></span>
          </a>
          <a className="contact-card" href={`tel:${store.phone.replace(/\s/g, '')}`}>
            <span className="contact-card__icon"><Icon name="phone" size={20} /></span>
            <span><small>Call us</small><b>{store.phone}</b></span>
          </a>
          <a className="contact-card" href={`mailto:${store.email}`}>
            <span className="contact-card__icon"><Icon name="mail" size={20} /></span>
            <span><small>Email</small><b>{store.email}</b></span>
          </a>
          <div className="contact-card">
            <span className="contact-card__icon"><Icon name="pin" size={20} /></span>
            <span><small>Address</small><b>{store.address}</b></span>
          </div>
        </div>
        <ContactForm />
      </div>
    </ContentPage>
  );
}
