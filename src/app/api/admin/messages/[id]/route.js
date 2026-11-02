import { handler, ok } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const PATCH = handler(async (_req, { params }) => {
  await requireAdmin('customers');
  await prisma.contactMessage.update({ where: { id: Number((await params).id) || 0 }, data: { is_read: true } });
  return ok({ message: 'Marked as read.' });
});

export const DELETE = handler(async (_req, { params }) => {
  await requireAdmin('customers');
  await prisma.contactMessage.delete({ where: { id: Number((await params).id) || 0 } });
  return ok({ message: 'Deleted.' });
});
