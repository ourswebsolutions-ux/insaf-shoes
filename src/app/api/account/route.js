import { z } from 'zod';
import { handler, ok, readJson } from '@/lib/api';
import { requireCustomer } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { pkPhone } from '@/lib/validation';

export const PATCH = handler(async (req) => {
  const customer = await requireCustomer();
  const data = z.object({ name: z.string().trim().min(1, 'Name is required').max(120), phone: pkPhone }).parse(await readJson(req));
  await prisma.customer.update({ where: { id: customer.id }, data: { name: data.name, phone: data.phone } });
  return ok({ message: 'Profile updated.' });
});
