import { z } from 'zod';
import { handler, ok, readJson } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

const schema = z.object({
  updates: z.array(z.object({ id: z.coerce.number().int().positive(), stock: z.coerce.number().int().min(0).max(1_000_000) })).min(1).max(500),
});

export const PATCH = handler(async (req) => {
  await requireAdmin('catalog');
  const { updates } = schema.parse(await readJson(req));
  await prisma.$transaction(updates.map((u) => prisma.productVariant.updateMany({ where: { id: u.id }, data: { stock: u.stock } })));
  return ok({ message: `Updated stock for ${updates.length} variant${updates.length > 1 ? 's' : ''}.` });
});
