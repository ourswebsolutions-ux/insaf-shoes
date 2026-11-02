import { z } from 'zod';
import { handler, ok, readJson } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

const schema = z.object({
  items: z.array(z.object({ id: z.coerce.number().int().positive(), sort_order: z.coerce.number().int(), show_on_home: z.boolean() })).max(200),
});

export const PATCH = handler(async (req) => {
  await requireAdmin('content');
  const { items } = schema.parse(await readJson(req));
  await prisma.$transaction(
    items.map((i) => prisma.category.updateMany({ where: { id: i.id }, data: { sort_order: i.sort_order, show_on_home: i.show_on_home } }))
  );
  return ok({ message: 'Category display updated.' });
});
