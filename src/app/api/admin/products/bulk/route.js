import { z } from 'zod';
import { handler, ok, readJson } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';
import { deleteProducts } from '@/lib/admin-catalog';
import { prisma } from '@/lib/db';

const schema = z.object({
  action: z.enum(['delete', 'show', 'hide']),
  ids: z.array(z.coerce.number().int().positive()).min(1, 'Select at least one product').max(1000),
});

// Bulk actions from the product tables. Only the exact ids sent are affected.
export const POST = handler(async (req) => {
  await requireAdmin('catalog');
  const { action, ids } = schema.parse(await readJson(req));
  const unique = [...new Set(ids)];
  if (action === 'delete') {
    const count = await prisma.$transaction(async (tx) => (await tx.product.deleteMany({ where: { id: { in: unique } } })).count);
    return ok({ count, message: `${count} product${count === 1 ? '' : 's'} deleted.` });
  }
  const { count } = await prisma.product.updateMany({ where: { id: { in: unique } }, data: { status: action === 'show' ? 'active' : 'inactive' } });
  return ok({ count, message: `${count} product${count === 1 ? ' is' : 's are'} now ${action === 'show' ? 'visible in the shop' : 'hidden from the shop'}.` });
});
