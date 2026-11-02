import { discountPercent, formatPrice } from '@/lib/format';

export default function PriceTag({ price, sale, showSave = false, className = 'price' }) {
  const onSale = sale && Number(sale) < Number(price);
  return (
    <div className={className}>
      <span className="price__now">{formatPrice(onSale ? sale : price)}</span>
      {onSale && <span className="price__was">{formatPrice(price)}</span>}
      {onSale && showSave && <span className="badge badge--red">Save {discountPercent(price, sale)}%</span>}
    </div>
  );
}
