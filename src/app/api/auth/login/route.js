import { handler, ok, readJson } from '@/lib/api';
import { rateLimit, setCustomerSession, verifyPassword } from '@/lib/auth';
import { mergeGuestCart } from '@/lib/cart';
import { prisma } from '@/lib/db';
import { AppError } from '@/lib/errors';
import { loginSchema } from '@/lib/validation';

export const POST = handler(async (req) => {
  const data = loginSchema.parse(await readJson(req));
  rateLimit(`login:${data.email}`);
  const row = await prisma.customer.findUnique({ where: { email: data.email } });
  if (!row || !(await verifyPassword(data.password, row.password_hash))) throw new AppError('Incorrect email or password.', 401);
  if (row.status !== 'active') throw new AppError('This account has been disabled. Please contact support.', 403);
  const customer = { id: row.id, name: row.name, email: row.email };
  await setCustomerSession(customer);
  await mergeGuestCart(customer);
  return ok({ customer });
});
