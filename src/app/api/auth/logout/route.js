import { cookies } from 'next/headers';
import { handler, ok } from '@/lib/api';
import { clearSession, CUSTOMER_COOKIE } from '@/lib/auth';
import { CART_COOKIE } from '@/lib/cart';

export const POST = handler(async () => {
  await clearSession(CUSTOMER_COOKIE);
  (await cookies()).delete(CART_COOKIE);
  return ok({ ok: true });
});
