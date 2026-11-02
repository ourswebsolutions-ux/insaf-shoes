import { handler, ok, readJson } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';
import { saveProduct } from '@/lib/admin-catalog';
import { productSchema } from '@/lib/validation';

export const POST = handler(async (req) => {
  await requireAdmin('catalog');
  const data = productSchema.parse(await readJson(req));
  const id = await saveProduct(data);
  return ok({ id, message: 'Product created.' });
});
