import Link from 'next/link';
import Icon from '@/components/Icon';
import Logo from '@/components/Logo';
import PaymentLogos from './PaymentLogos';
import { SocialLinks } from './Newsletter';

export default function Footer({ store, menu }) {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div className="footer__brand">
          <Logo variant="light" name={store.name} tagline={store.tagline} />
          <p className="footer__about">{store.about}</p>
          <SocialLinks social={store.social} className="footer__social" />
        </div>
        <div>
          <h4>Quick Links</h4>
          <ul className="footer__links">
            <li><Link href="/">Home</Link></li>
            {menu.map((c) => (
              <li key={c.id}>
                <Link href={`/category/${c.slug}`}>{c.name}</Link>
              </li>
            ))}
            <li><Link href="/sale">Sale</Link></li>
            <li><Link href="/about">About Us</Link></li>
          </ul>
        </div>
        <div>
          <h4>Customer Care</h4>
          <ul className="footer__links">
            <li><Link href="/faq">FAQ</Link></li>
            <li><Link href="/shipping-policy">Shipping Policy</Link></li>
            <li><Link href="/return-policy">Return Policy</Link></li>
            <li><Link href="/track-order">Track Order</Link></li>
            <li><Link href="/contact">Contact Us</Link></li>
            <li><Link href="/privacy-policy">Privacy Policy</Link></li>
            <li><Link href="/terms">Terms &amp; Conditions</Link></li>
          </ul>
        </div>
        <div className="footer__pay">
          <h4>Payment Methods</h4>
          <PaymentLogos />
          <p style={{ fontSize: 13, marginTop: 14, opacity: 0.8 }}>Cash on Delivery available all over Pakistan.</p>
        </div>
        <div className="footer__contact-col">
          <h4>Contact Us</h4>
          <ul className="footer__contact">
            <li><Icon name="phone" size={18} /><a href={`tel:${store.phone.replace(/\s/g, '')}`}>{store.phone}</a></li>
            <li><Icon name="mail" size={18} /><a href={`mailto:${store.email}`}>{store.email}</a></li>
            <li><Icon name="pin" size={18} />{store.address}</li>
          </ul>
        </div>
      </div>
      <div className="footer__bottom">
        <div className="container">
          <span>© {year} {store.name}. All Rights Reserved.</span>
          <span>
            Designed with <span className="heart">♥</span> for Fashion Lovers
          </span>
        </div>
      </div>
    </footer>
  );
}
