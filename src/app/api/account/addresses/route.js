import { handler, ok, readJson } from '@/lib/api';
import { requireCustomer } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { addressSchema } from '@/lib/validation';

export const POST = handler(async (req) => {
  const customer = await requireCustomer();
  const { is_default, ...a } = addressSchema.parse(await readJson(req));
  await prisma.$transaction(async (tx) => {
    const isDefault = is_default || (await tx.address.count({ where: { customer_id: customer.id } })) === 0;
    if (isDefault) await tx.address.updateMany({ where: { customer_id: customer.id }, data: { is_default: false } });
    await tx.address.create({ data: { ...a, postal_code: a.postal_code || null, customer_id: customer.id, is_default: isDefault } });
  });
  return ok({ message: 'Address saved.' });
});
