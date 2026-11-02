import { z } from 'zod';
import { handler, ok, readJson } from '@/lib/api';
import { hashPassword, requireCustomer, verifyPassword } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { AppError } from '@/lib/errors';
import { password } from '@/lib/validation';

export const POST = handler(async (req) => {
  const customer = await requireCustomer();
  const data = z.object({ current: z.string().min(1, 'Enter your current password'), next: password }).parse(await readJson(req));
  const row = await prisma.customer.findUnique({ where: { id: customer.id }, select: { password_hash: true } });
  if (!(await verifyPassword(data.current, row.password_hash))) throw new AppError('Current password is incorrect.', 400, { current: 'Incorrect password' });
  await prisma.customer.update({ where: { id: customer.id }, data: { password_hash: await hashPassword(data.next) } });
  return ok({ message: 'Password changed.' });
});
