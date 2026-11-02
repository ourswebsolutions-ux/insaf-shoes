import CategoryManager from '@/components/admin/CategoryManager';
import { pageAdmin } from '@/lib/admin';
import { categoriesWithCounts } from '@/lib/admin-categories';

export const metadata = { title: 'Categories' };

export default async function CategoriesAdmin() {
  await pageAdmin('catalog');
  return <CategoryManager categories={JSON.parse(JSON.stringify(await categoriesWithCounts()))} />;
}
