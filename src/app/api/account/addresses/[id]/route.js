import { handler, ok, readJson } from '@/lib/api';
import { requireCustomer } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { AppError } from '@/lib/errors';
import { addressSchema } from '@/lib/validation';

async function own(customer, params) {
  const id = Number((await params).id) || 0;
  const address = await prisma.address.findFirst({ where: { id, customer_id: customer.id } });
  if (!address) throw new AppError('Address not found', 404);
  return address;
}

export const PUT = handler(async (req, { params }) => {
  const customer = await requireCustomer();
  const address = await own(customer, params);
  const { is_default, ...a } = addressSchema.parse(await readJson(req));
  await prisma.$transaction(async (tx) => {
    if (is_default) await tx.address.updateMany({ where: { customer_id: customer.id }, data: { is_default: false } });
    await tx.address.update({
      where: { id: address.id },
      data: { ...a, postal_code: a.postal_code || null, ...(is_default ? { is_default: true } : {}) },
    });
  });
  return ok({ message: 'Address updated.' });
});

export const DELETE = handler(async (_req, { params }) => {
  const customer = await requireCustomer();
  const address = await own(customer, params);
  await prisma.address.delete({ where: { id: address.id } });
  return ok({ message: 'Address removed.' });
});
