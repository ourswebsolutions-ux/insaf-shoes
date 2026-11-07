import './admin.css';

export const metadata = { title: { default: 'Admin', template: '%s | Insaf Shoes Admin' }, robots: { index: false, follow: false } };

export default function AdminRootLayout({ children }) {
  return children;
}
