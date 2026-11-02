import ProductCard from './ProductCard';

export default function ProductGrid({ products, className = 'product-grid', priorityCount = 0 }) {
  return (
    <div className={className}>
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} index={i} priority={i < priorityCount} />
      ))}
    </div>
  );
}
