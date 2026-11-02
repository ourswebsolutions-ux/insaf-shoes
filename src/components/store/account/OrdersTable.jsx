import Link from 'next/link';
import { StatusBadge } from '../order/OrderDetails';
import { formatDate, formatPrice, PAYMENT_LABELS } from '@/lib/format';

export default function OrdersTable({ orders }) {
  return (
    <div className="table-wrap">
      <table className="table table--stack">
        <thead>
          <tr><th>Order</th><th>Date</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th></th></tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td data-label="Order"><b>#{o.order_number}</b></td>
              <td data-label="Date">{formatDate(o.created_at)}</td>
              <td data-label="Items">{o.item_count}</td>
              <td data-label="Total">{formatPrice(o.total)}</td>
              <td data-label="Payment">{PAYMENT_LABELS[o.payment_method]}</td>
              <td data-label="Status"><StatusBadge value={o.status} /></td>
              <td><Link href={`/order/${o.order_number}`} className="btn btn--outline btn--sm">View</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
