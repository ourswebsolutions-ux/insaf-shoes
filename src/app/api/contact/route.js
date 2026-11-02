import { handler, ok, readJson } from '@/lib/api';
import { rateLimit } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { AppError } from '@/lib/errors';
import { contactSchema } from '@/lib/validation';

export const POST = handler(async (req) => {
  rateLimit(`contact:${req.headers.get('x-forwarded-for') || 'local'}`, 5, 60 * 60 * 1000);
  const d = contactSchema.parse(await readJson(req));
  if (!d.email && !d.phone) throw new AppError('Please provide an email or phone number so we can reply.');
  await prisma.contactMessage.create({ data: { name: d.name, email: d.email, phone: d.phone, subject: d.subject, message: d.message } });
  return ok({ message: 'Thank you! Your message has been received. We usually reply within a few hours.' });
});
