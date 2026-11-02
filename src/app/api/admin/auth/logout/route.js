import { handler, ok } from '@/lib/api';
import { ADMIN_COOKIE, clearSession } from '@/lib/auth';

export const POST = handler(async () => {
  await clearSession(ADMIN_COOKIE);
  return ok({ ok: true });
});
