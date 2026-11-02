import { handler, ok, readJson } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { couponData, couponSchema } from '@/lib/validation';

export const PUT = handler(async (req, { params }) => {
  await requireAdmin('marketing');
  const id = Number((await params).id) || 0;
  await prisma.coupon.update({ where: { id }, data: couponData(couponSchema.parse(await readJson(req))) });
  return ok({ message: 'Coupon saved.' });
});

export const DELETE = handler(async (_req, { params }) => {
  await requireAdmin('marketing');
  await prisma.coupon.delete({ where: { id: Number((await params).id) || 0 } });
  return ok({ message: 'Coupon deleted.' });
});
