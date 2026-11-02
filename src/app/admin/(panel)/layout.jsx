import { redirect } from 'next/navigation';
import AdminShell from '@/components/admin/AdminShell';
import { adminCan, getAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

export default async function PanelLayout({ children }) {
  const admin = await getAdmin();
  if (!admin) redirect('/admin/login');

  const [pendingOrders, pendingReviews, unreadMessages] = await Promise.all([
    prisma.order.count({ where: { status: 'pending' } }),
    prisma.review.count({ where: { status: 'pending' } }),
    prisma.contactMessage.count({ where: { is_read: false } }),
  ]);

  const groups = [
    { label: '', items: [{ href: '/admin', label: 'Dashboard', icon: 'grid', area: 'dashboard' }] },
    {
      label: 'Products',
      items: [
        { href: '/admin/products', label: 'Manage Products', icon: 'box', area: 'catalog' },
        { href: '/admin/categories', label: 'Categories', icon: 'layers', area: 'catalog' },
        { href: '/admin/inventory', label: 'Stock', icon: 'package', area: 'catalog' },
      ],
    },
    {
      label: 'Sales',
      items: [
        { href: '/admin/orders', label: 'Orders', icon: 'cart', area: 'orders', count: pendingOrders },
        { href: '/admin/customers', label: 'Customers', icon: 'users', area: 'customers' },
        { href: '/admin/coupons', label: 'Discounts', icon: 'percent', area: 'marketing' },
        { href: '/admin/reviews', label: 'Reviews', icon: 'star', area: 'reviews', count: pendingReviews },
        { href: '/admin/messages', label: 'Messages', icon: 'message', area: 'customers', count: unreadMessages },
      ],
    },
    {
      label: 'Website',
      items: [
        { href: '/admin/homepage', label: 'Homepage', icon: 'home', area: 'content' },
        { href: '/admin/settings', label: 'Store Settings', icon: 'settings', area: 'settings' },
      ],
    },
  ];
  const nav = groups
    .map((g) => ({ ...g, items: g.items.filter((i) => adminCan(admin, i.area)).map(({ area, ...rest }) => rest) }))
    .filter((g) => g.items.length);

  return (
    <AdminShell admin={{ name: admin.name, email: admin.email, role: admin.role }} nav={nav} canAddProduct={adminCan(admin, 'catalog')}>
      {children}
    </AdminShell>
  );
}
