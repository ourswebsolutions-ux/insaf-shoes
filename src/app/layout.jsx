import { Cinzel, Inter, Poppins } from 'next/font/google';
import { getSettings } from '@/lib/settings';
import './globals.css';

const poppins = Poppins({ subsets: ['latin'], weight: ['500', '600', '700', '800'], variable: '--font-poppins', display: 'swap' });
const cinzel = Cinzel({ subsets: ['latin'], weight: ['600', '700'], variable: '--font-cinzel', display: 'swap' });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export async function generateMetadata() {
  const { store } = await getSettings();
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
    title: { default: store.seo_title, template: `%s | ${store.name}` },
    description: store.seo_description,
    applicationName: store.name,
    openGraph: { type: 'website', siteName: store.name, locale: 'en_PK' },
    icons: { icon: '/icon.png', apple: '/apple-icon.png' },
  };
}

// Every page reads store settings from the database, so render on request
// rather than at build time (builds then don't need a database).
export const dynamic = 'force-dynamic';

export const viewport = { themeColor: '#0b0b0b', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${poppins.variable} ${inter.variable} ${cinzel.variable}`}>
      <body>{children}</body>
    </html>
  );
}
