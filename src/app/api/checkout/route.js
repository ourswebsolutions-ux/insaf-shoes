import { handler, ok, readJson } from '@/lib/api';
import { getCustomer } from '@/lib/auth';
import { findCart } from '@/lib/cart';
import { AppError } from '@/lib/errors';
import { placeOrder } from '@/lib/orders';
import { checkoutSchema } from '@/lib/validation';

export const POST = handler(async (req) => {
  const checkout = checkoutSchema.parse(await readJson(req));
  const customer = await getCustomer();
  const cart = await findCart(customer);
  if (!cart) throw new AppError('Your cart is empty.');

  const order = await placeOrder({ cart, customer, checkout });
  const q = `order=${order.order_number}&t=${order.access_token}`;
  const redirect =
    order.payment_method === 'jazzcash'
      ? `/api/payments/jazzcash/start?${q}`
      : order.payment_method === 'easypaisa'
        ? `/api/payments/easypaisa/start?${q}`
        : `/order/${order.order_number}?t=${order.access_token}&placed=1`;
  return ok({ order_number: order.order_number, redirect });
});
