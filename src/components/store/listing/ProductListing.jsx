import { Suspense } from 'react';
import Link from 'next/link';
import Icon from '@/components/Icon';
import ProductGrid from '../ProductGrid';
import Filters, { ActiveFilters, FilterToggle, SortSelect } from './Filters';
import { buildTree, getCategories, getFacets, listProducts } from '@/lib/catalog';

const PER_PAGE = 16;

export function parseListingParams(sp) {
  const num = (v) => (v != null && v !== '' && !isNaN(Number(v)) ? Number(v) : null);
  const arr = (v) => (v ? String(v).split(',').filter(Boolean).slice(0, 20) : []);
  return {
    q: sp.q ? String(sp.q).slice(0, 100) : null,
    sort: sp.sort || null,
    page: Math.max(1, num(sp.page) || 1),
    minPrice: num(sp.min),
    maxPrice: num(sp.max),
    sizes: arr(sp.size),
    colors: arr(sp.color),
    inStock: sp.stock === '1',
    minDiscount: num(sp.discount),
  };
}

function pageHref(basePath, sp, page) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) if (v != null && k !== 'page') p.set(k, Array.isArray(v) ? v.join(',') : v);
  if (page > 1) p.set('page', page);
  const qs = p.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

function Pagination({ page, pages, basePath, sp }) {
  if (pages < 2) return null;
  const nums = [];
  for (let i = 1; i <= pages; i++) if (i === 1 || i === pages || Math.abs(i - page) <= 1) nums.push(i);
  const out = [];
  nums.forEach((n, i) => {
    if (i && n - nums[i - 1] > 1) out.push(<span key={`gap${n}`}>…</span>);
    out.push(
      n === page ? (
        <span key={n} className="is-active" aria-current="page">{n}</span>
      ) : (
        <Link key={n} href={pageHref(basePath, sp, n)}>{n}</Link>
      )
    );
  });
  return (
    <nav className="pagination" aria-label="Pagination">
      {page > 1 && <Link href={pageHref(basePath, sp, page - 1)} aria-label="Previous page"><Icon name="chevronLeft" size={16} /></Link>}
      {out}
      {page < pages && <Link href={pageHref(basePath, sp, page + 1)} aria-label="Next page"><Icon name="chevronRight" size={16} /></Link>}
    </nav>
  );
}

/**
 * Shared listing: header, sidebar filters, sort, grid and pagination.
 * `base` holds fixed filters for the page (category, flag, onSale).
 */
export default async function ProductListing({ title, description, crumbs = [], base = {}, searchParams, basePath, chips, activeCategoryId }) {
  const f = parseListingParams(searchParams);
  const [result, facets, allCats] = await Promise.all([
    listProducts({ ...base, ...f, limit: PER_PAGE }),
    getFacets(base.categoryIds),
    getCategories(),
  ]);
  const tree = buildTree(allCats).filter((c) => !c.parent_id);

  return (
    <>
      <section className="page-head">
        <div className="container page-head__inner">
          <nav className="crumbs" aria-label="Breadcrumb" style={{ paddingTop: 0 }}>
            <Link href="/">Home</Link>
            {crumbs.map((c) => (
              <span key={c.label} style={{ display: 'contents' }}>
                <Icon name="chevronRight" size={14} />
                {c.href ? <Link href={c.href}>{c.label}</Link> : <span>{c.label}</span>}
              </span>
            ))}
          </nav>
          <h1>{f.q ? `Search results for “${f.q}”` : title}</h1>
          {description && <p>{description}</p>}
          {chips?.length > 0 && (
            <div className="chips">
              {chips.map((c) => (
                <Link key={c.href} href={c.href} className={`chip ${c.active ? 'is-active' : ''}`}>
                  {c.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
      <div className="container shop">
        <Suspense>
          <Filters facets={facets} categories={tree} activeCategoryId={activeCategoryId} />
        </Suspense>
        <div>
          <div className="toolbar">
            <p className="toolbar__count">
              {result.total} {result.total === 1 ? 'product' : 'products'}
            </p>
            <div className="toolbar__right">
              <Suspense>
                <FilterToggle />
                <SortSelect />
              </Suspense>
            </div>
          </div>
          <Suspense>
            <ActiveFilters />
          </Suspense>
          {result.items.length ? (
            <ProductGrid products={result.items} className="product-grid product-grid--4" priorityCount={4} />
          ) : (
            <div className="empty">
              <Icon name="search" size={44} />
              <h2>No products found</h2>
              <p>Try removing some filters or searching for something else.</p>
              <Link href={basePath} className="btn btn--primary">Clear filters</Link>
            </div>
          )}
          <Pagination page={result.page} pages={result.pages} basePath={basePath} sp={searchParams} />
        </div>
      </div>
    </>
  );
}
