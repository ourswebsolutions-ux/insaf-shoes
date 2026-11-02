import './admin.css';

export const metadata = { title: { default: 'Admin', template: '%s | PunjabShop Admin' }, robots: { index: false, follow: false } };

export default function AdminRootLayout({ children }) {
  return children;
}
