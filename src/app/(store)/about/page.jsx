import Image from 'next/image';
import Link from 'next/link';
import Icon from '@/components/Icon';
import ContentPage from '@/components/store/content/ContentPage';
import { queryOne } from '@/lib/db';
import { getSettings } from '@/lib/settings';

export const metadata = { title: 'About Us', description: 'Learn about Insaf Shoes – premium footwear delivered all over Pakistan.' };

export default async function AboutPage() {
  const [{ store, homepage }, img] = await Promise.all([
    getSettings(),
    queryOne("SELECT image FROM categories WHERE status = 'active' AND image IS NOT NULL ORDER BY show_on_home DESC, sort_order LIMIT 1"),
  ]);
  return (
    <ContentPage title="About Us" intro={`${store.name} – ${store.tagline}.`} narrow={false}>
      <div className="about-hero">
        <div className="prose">
          <h2 style={{ marginTop: 0 }}>Premium footwear for every step</h2>
          <p>
            {store.name} started with a simple idea: everyone in Pakistan deserves stylish, comfortable and long-lasting shoes at a fair price, delivered right to
            their doorstep. From everyday sneakers and sports shoes to elegant heels, handcrafted formal shoes and traditional chappals, we carefully select every
            pair for quality and comfort.
          </p>
          <p>
            We deliver to every city in Pakistan with Cash on Delivery, easy 7-day exchanges and a friendly support team that is always a WhatsApp message away.
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
            <Link href="/shop" className="btn btn--primary">Shop the collection <Icon name="arrowRight" size={18} className="arrow" /></Link>
            <Link href="/contact" className="btn btn--outline">Contact us</Link>
          </div>
        </div>
        {img?.image && (
          <div className="about-hero__img">
            <Image src={img.image} alt="" fill sizes="(max-width: 900px) 100vw, 50vw" />
          </div>
        )}
      </div>
      <div className="features" style={{ marginTop: 40 }}>
        {homepage.features.map((f, i) => (
          <div className="feature" key={i}>
            <Icon name={f.icon} size={34} className="feature__icon" />
            <div><div className="feature__title">{f.title}</div><div className="feature__text">{f.text}</div></div>
          </div>
        ))}
      </div>
    </ContentPage>
  );
}
