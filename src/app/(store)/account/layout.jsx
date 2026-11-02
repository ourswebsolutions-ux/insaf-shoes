import Link from 'next/link';
import { redirect } from 'next/navigation';
import Icon from '@/components/Icon';
import AccountNav from '@/components/store/account/AccountNav';
import { getCustomer } from '@/lib/auth';

export const metadata = { title: 'My Account', robots: { index: false } };

export default async function AccountLayout({ children }) {
  const customer = await getCustomer();
  if (!customer) redirect('/login?next=/account');
  return (
    <div className="container">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <Icon name="chevronRight" size={14} />
        <span>My Account</span>
      </nav>
      <div className="account">
        <AccountNav customer={{ name: customer.name, email: customer.email }} />
        <div>{children}</div>
      </div>
    </div>
  );
}
