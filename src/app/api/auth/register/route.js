import { handler, ok, readJson } from '@/lib/api';
import { hashPassword, rateLimit, setCustomerSession } from '@/lib/auth';
import { mergeGuestCart } from '@/lib/cart';
import { prisma } from '@/lib/db';
import { AppError } from '@/lib/errors';
import { registerSchema } from '@/lib/validation';

export const POST = handler(async (req) => {
  rateLimit(`register:${req.headers.get('x-forwarded-for') || 'local'}`, 10);
  const data = registerSchema.parse(await readJson(req));
  if (await prisma.customer.findUnique({ where: { email: data.email }, select: { id: true } }))
    throw new AppError('An account with this email already exists. Please log in.', 409, { email: 'Email already registered' });
  const customer = await prisma.customer.create({
    data: { name: data.name, email: data.email, phone: data.phone, password_hash: await hashPassword(data.password) },
    select: { id: true, name: true, email: true },
  });
  await setCustomerSession(customer);
  await mergeGuestCart(customer);
  // Link earlier guest orders placed with the same email.
  await prisma.order.updateMany({ where: { customer_id: null, email: data.email }, data: { customer_id: customer.id } });
  return ok({ customer });
});
