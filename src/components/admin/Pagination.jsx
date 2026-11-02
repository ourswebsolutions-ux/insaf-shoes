import Link from 'next/link';
import Icon from '@/components/Icon';

export default function AdminPagination({ page, pages, total, basePath, params }) {
  if (pages < 2) return <p className="muted" style={{ padding: '12px 16px', fontSize: 13 }}>{total} total</p>;
  const href = (p) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v && k !== 'page') sp.set(k, v);
    if (p > 1) sp.set('page', p);
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', gap: 10, flexWrap: 'wrap' }}>
      <span className="muted" style={{ fontSize: 13 }}>{total} total · page {page} of {pages}</span>
      <div style={{ display: 'flex', gap: 6 }}>
        {page > 1 && <Link className="btn btn--outline btn--sm" href={href(page - 1)}><Icon name="chevronLeft" size={14} /> Prev</Link>}
        {page < pages && <Link className="btn btn--outline btn--sm" href={href(page + 1)}>Next <Icon name="chevronRight" size={14} /></Link>}
      </div>
    </div>
  );
}
