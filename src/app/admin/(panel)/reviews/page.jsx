import Link from 'next/link';
import Icon from '@/components/Icon';
import AdminPagination from '@/components/admin/Pagination';
import { ActionButton } from '@/components/admin/SmallActions';
import { DeleteButton } from '@/components/admin/ui';
import Stars from '@/components/store/Stars';
import { pageAdmin, pageParams } from '@/lib/admin';
import { query, queryOne } from '@/lib/db';
import { formatDate } from '@/lib/format';

export const metadata = { title: 'Reviews' };
const PER = 20;

export default async function ReviewsAdmin({ searchParams }) {
  await pageAdmin('reviews');
  const sp = pageParams(await searchParams, { status: 'pending' });
  const status = ['pending', 'approved', 'rejected'].includes(sp.status) ? sp.status : null;
  const where = status ? 'r.status = ?' : '1=1';
  const params = status ? [status] : [];
  const [rows, count, counts] = await Promise.all([
    query(`SELECT r.*, p.name AS product, p.slug FROM reviews r JOIN products p ON p.id = r.product_id WHERE ${where} ORDER BY r.created_at DESC LIMIT ? OFFSET ?`, [...params, PER, (sp.page - 1) * PER]),
    queryOne(`SELECT COUNT(*) AS n FROM reviews r WHERE ${where}`, params),
    query('SELECT status, COUNT(*) AS n FROM reviews GROUP BY status'),
  ]);
  const c = Object.fromEntries(counts.map((r) => [r.status, r.n]));
  return (
    <>
      <div className="page-bar"><div><h1>Reviews</h1><p>Approve reviews before they appear on product pages. Ratings update automatically.</p></div></div>
      <nav className="tabs-nav">
        {['pending', 'approved', 'rejected', 'all'].map((s) => (
          <Link key={s} href={`/admin/reviews?status=${s}`} className={(status || 'all') === s ? 'is-active' : ''}>{s[0].toUpperCase() + s.slice(1)} {s !== 'all' && `(${c[s] || 0})`}</Link>
        ))}
      </nav>
      <section className="panel">
        {rows.map((r) => (
          <div key={r.id} style={{ padding: '16px 20px', borderBottom: '1px solid var(--line-2)', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <Stars value={r.rating} /> <b>{r.name}</b>
                {r.is_verified_purchase ? <span className="verified"><Icon name="check" size={13} /> Verified</span> : null}
                <span className={`status status--${r.status}`}>{r.status}</span>
              </div>
              <p style={{ fontSize: 13 }} className="muted">on <a className="link" href={`/product/${r.slug}`} target="_blank">{r.product}</a> · {formatDate(r.created_at, true)}</p>
              {r.title && <b style={{ display: 'block', marginTop: 6 }}>{r.title}</b>}
              <p style={{ marginTop: 4 }}>{r.comment}</p>
            </div>
            <div className="row-actions" style={{ alignItems: 'start' }}>
              {r.status !== 'approved' && <ActionButton url={`/api/admin/reviews/${r.id}`} body={{ status: 'approved' }} className="btn btn--primary btn--sm">Approve</ActionButton>}
              {r.status !== 'rejected' && <ActionButton url={`/api/admin/reviews/${r.id}`} body={{ status: 'rejected' }}>Reject</ActionButton>}
              <DeleteButton url={`/api/admin/reviews/${r.id}`} />
            </div>
          </div>
        ))}
        {!rows.length && <p className="muted" style={{ textAlign: 'center', padding: 40 }}>No reviews here.</p>}
        <AdminPagination page={sp.page} pages={Math.ceil(count.n / PER)} total={count.n} basePath="/admin/reviews" params={sp} />
      </section>
    </>
  );
}
