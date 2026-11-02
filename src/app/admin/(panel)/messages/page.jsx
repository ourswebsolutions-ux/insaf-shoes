import { ActionButton } from '@/components/admin/SmallActions';
import { DeleteButton } from '@/components/admin/ui';
import { pageAdmin } from '@/lib/admin';
import { query } from '@/lib/db';
import { formatDate } from '@/lib/format';

export const metadata = { title: 'Messages' };

export default async function MessagesAdmin() {
  await pageAdmin('customers');
  const [messages, subs] = await Promise.all([
    query('SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT 200'),
    query('SELECT * FROM newsletter_subscribers ORDER BY created_at DESC LIMIT 500'),
  ]);
  return (
    <>
      <div className="page-bar"><div><h1>Messages</h1><p>Contact form submissions and newsletter subscribers.</p></div></div>
      <div className="admin-grid-2">
        <section className="panel">
          <div className="panel__head"><h3>Contact messages ({messages.length})</h3></div>
          {messages.map((m) => (
            <div key={m.id} style={{ padding: '14px 20px', borderBottom: '1px solid var(--line-2)', background: m.is_read ? undefined : 'var(--green-50)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                <span><b>{m.name}</b> <span className="muted" style={{ fontSize: 13 }}>{[m.phone, m.email].filter(Boolean).join(' · ')}</span></span>
                <span className="muted" style={{ fontSize: 13 }}>{formatDate(m.created_at, true)}</span>
              </div>
              {m.subject && <b style={{ display: 'block', marginTop: 4 }}>{m.subject}</b>}
              <p style={{ marginTop: 4, whiteSpace: 'pre-wrap' }}>{m.message}</p>
              <div className="row-actions" style={{ justifyContent: 'flex-start', marginTop: 8 }}>
                {!m.is_read && <ActionButton url={`/api/admin/messages/${m.id}`}>Mark read</ActionButton>}
                {m.email && <a className="btn btn--outline btn--sm" href={`mailto:${m.email}?subject=Re: ${encodeURIComponent(m.subject || 'Your message')}`}>Reply</a>}
                <DeleteButton url={`/api/admin/messages/${m.id}`} />
              </div>
            </div>
          ))}
          {!messages.length && <p className="muted" style={{ padding: 30, textAlign: 'center' }}>No messages yet.</p>}
        </section>
        <section className="panel">
          <div className="panel__head"><h3>Newsletter ({subs.length})</h3></div>
          <div className="panel__body" style={{ display: 'grid', gap: 6, fontSize: 14, maxHeight: 600, overflowY: 'auto' }}>
            {subs.map((s) => <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><span>{s.email}</span><span className="muted">{formatDate(s.created_at)}</span></div>)}
            {!subs.length && <p className="muted">No subscribers yet.</p>}
          </div>
        </section>
      </div>
    </>
  );
}
