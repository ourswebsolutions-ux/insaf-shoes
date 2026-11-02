import { handler, ok, readJson } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { couponData, couponSchema } from '@/lib/validation';

export const POST = handler(async (req) => {
  await requireAdmin('marketing');
  await prisma.coupon.create({ data: couponData(couponSchema.parse(await readJson(req))) });
  return ok({ message: 'Coupon created.' });
});
