'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Icon from '@/components/Icon';

const DISCOUNTS = [10, 20, 30, 50];

export function useFilterNav() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const push = (changes) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(changes)) {
      if (v == null || v === '' || (Array.isArray(v) && !v.length)) next.delete(k);
      else next.set(k, Array.isArray(v) ? v.join(',') : String(v));
    }
    next.delete('page');
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };
  const list = (k) => (params.get(k) ? params.get(k).split(',') : []);
  return { params, push, list, pathname };
}

export function FilterToggle() {
  return (
    <button type="button" className="btn btn--outline btn--sm filter-toggle" onClick={() => window.dispatchEvent(new Event('ps:filters'))}>
      <Icon name="sliders" size={16} /> Filters
    </button>
  );
}

export function SortSelect() {
  const { params, push } = useFilterNav();
  return (
    <label className="sr-only-wrap" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span className="sr-only">Sort by</span>
      <select className="select" value={params.get('sort') || 'newest'} onChange={(e) => push({ sort: e.target.value === 'newest' ? null : e.target.value })}>
        <option value="newest">Sort: Newest</option>
        <option value="price_asc">Price: Low to High</option>
        <option value="price_desc">Price: High to Low</option>
        <option value="best_selling">Best Selling</option>
        <option value="popularity">Popularity</option>
        <option value="rating">Top Rated</option>
      </select>
    </label>
  );
}

export default function Filters({ facets, categories, activeCategoryId, showDiscount = true }) {
  const { params, push, list } = useFilterNav();
  const [open, setOpen] = useState(false);
  const [min, setMin] = useState(params.get('min') || '');
  const [max, setMax] = useState(params.get('max') || '');
  const sizes = list('size');
  const colors = list('color');

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener('ps:filters', onOpen);
    return () => window.removeEventListener('ps:filters', onOpen);
  }, []);
  useEffect(() => {
    setMin(params.get('min') || '');
    setMax(params.get('max') || '');
  }, [params]);

  const toggle = (key, current, value) => push({ [key]: current.includes(value) ? current.filter((v) => v !== value) : [...current, value] });

  return (
    <>
      <div className={`drawer-backdrop ${open ? 'is-open' : ''}`} onClick={() => setOpen(false)} style={{ zIndex: 105 }} />
      <aside className={`filters ${open ? 'is-open' : ''}`} aria-label="Product filters">
        <div className="filters__head">
          <h3>Filters</h3>
          <button className="icon-btn" onClick={() => setOpen(false)} aria-label="Close filters">
            <Icon name="x" size={18} />
          </button>
        </div>

        {categories?.length > 0 && (
          <div className="filter-group">
            <h4>Category</h4>
            <div className="filter-list">
              {categories.map((c) => (
                <div key={c.id}>
                  <Link href={`/category/${c.slug}`} className={activeCategoryId === c.id ? 'is-active' : ''}>
                    {c.name} <span className="count">{c.product_count}</span>
                  </Link>
                  {c.children?.length > 0 && (
                    <div className="filter-sub">
                      {c.children.map((s) => (
                        <Link key={s.id} href={`/category/${s.slug}`} className={activeCategoryId === s.id ? 'is-active' : ''} style={{ fontSize: 13.5 }}>
                          {s.name} <span className="count">{s.product_count}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="filter-group">
          <h4>Price (Rs.)</h4>
          <form
            className="price-inputs"
            onSubmit={(e) => {
              e.preventDefault();
              push({ min: min || null, max: max || null });
            }}
          >
            <input className="input" type="number" min="0" inputMode="numeric" placeholder={`${facets.minPrice}`} value={min} onChange={(e) => setMin(e.target.value)} aria-label="Minimum price" />
            <span>–</span>
            <input className="input" type="number" min="0" inputMode="numeric" placeholder={`${facets.maxPrice}`} value={max} onChange={(e) => setMax(e.target.value)} aria-label="Maximum price" />
            <button className="btn btn--ghost btn--sm btn--square" style={{ gridColumn: 'span 3' }}>
              Apply price
            </button>
          </form>
        </div>

        {facets.sizes.length > 0 && (
          <div className="filter-group">
            <h4>Size</h4>
            <div className="size-grid">
              {facets.sizes.map((s) => (
                <button key={s} type="button" className={`size-opt ${sizes.includes(s) ? 'is-active' : ''}`} onClick={() => toggle('size', sizes, s)} aria-pressed={sizes.includes(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {facets.colors.length > 0 && (
          <div className="filter-group">
            <h4>Colour</h4>
            <div className="swatches">
              {facets.colors.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  className={`swatch ${colors.includes(c.name) ? 'is-active' : ''}`}
                  style={{ background: c.hex || '#ccc' }}
                  title={c.name}
                  aria-label={c.name}
                  aria-pressed={colors.includes(c.name)}
                  onClick={() => toggle('color', colors, c.name)}
                />
              ))}
            </div>
          </div>
        )}

        <div className="filter-group">
          <h4>Availability</h4>
          <div className="filter-list">
            <label className="checkbox">
              <input type="checkbox" checked={params.get('stock') === '1'} onChange={(e) => push({ stock: e.target.checked ? 1 : null })} /> In stock only
            </label>
          </div>
        </div>

        {showDiscount && (
          <div className="filter-group">
            <h4>Discount</h4>
            <div className="filter-list">
              {DISCOUNTS.map((d) => (
                <label key={d} className="checkbox">
                  <input type="radio" name="discount" checked={params.get('discount') === String(d)} onChange={() => push({ discount: d })} /> {d}% off or more
                </label>
              ))}
              {params.get('discount') && (
                <button type="button" className="link" style={{ background: 'none', border: 0, padding: 0, textAlign: 'left', fontSize: 13 }} onClick={() => push({ discount: null })}>
                  Clear discount
                </button>
              )}
            </div>
          </div>
        )}

        <div className="filters__apply">
          <button className="btn btn--primary btn--block" onClick={() => setOpen(false)}>
            Show results
          </button>
        </div>
      </aside>
    </>
  );
}

export function ActiveFilters() {
  const { params, push, list } = useFilterNav();
  const chips = [];
  if (params.get('q')) chips.push({ label: `“${params.get('q')}”`, clear: { q: null } });
  if (params.get('min') || params.get('max'))
    chips.push({ label: `Rs. ${params.get('min') || 0} – ${params.get('max') || '∞'}`, clear: { min: null, max: null } });
  for (const s of list('size')) chips.push({ label: `Size ${s}`, clear: { size: list('size').filter((x) => x !== s) } });
  for (const c of list('color')) chips.push({ label: c, clear: { color: list('color').filter((x) => x !== c) } });
  if (params.get('stock')) chips.push({ label: 'In stock', clear: { stock: null } });
  if (params.get('discount')) chips.push({ label: `${params.get('discount')}%+ off`, clear: { discount: null } });
  if (!chips.length) return null;
  return (
    <div className="active-filters">
      {chips.map((c) => (
        <button key={c.label} className="chip" onClick={() => push(c.clear)}>
          {c.label} <Icon name="x" size={14} />
        </button>
      ))}
      <button className="chip" onClick={() => push({ q: null, min: null, max: null, size: null, color: null, stock: null, discount: null })}>
        Clear all
      </button>
    </div>
  );
}
