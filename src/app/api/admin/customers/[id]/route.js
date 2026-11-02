import { z } from 'zod';
import { handler, ok, readJson } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const PATCH = handler(async (req, { params }) => {
  await requireAdmin('customers');
  const id = Number((await params).id) || 0;
  const { status } = z.object({ status: z.enum(['active', 'blocked']) }).parse(await readJson(req));
  await prisma.customer.update({ where: { id }, data: { status } });
  return ok({ message: status === 'blocked' ? 'Customer blocked.' : 'Customer unblocked.' });
});
