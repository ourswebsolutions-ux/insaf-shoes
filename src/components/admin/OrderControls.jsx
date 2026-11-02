'use client';

import { useState } from 'react';
import { humanize, ORDER_STATUSES, PAYMENT_STATUSES } from '@/lib/format';
import { FormMessage, useMutation } from './ui';

export default function OrderControls({ order }) {
  const url = `/api/admin/orders/${order.id}`;
  const [status, setStatus] = useState(order.status);
  const [note, setNote] = useState('');
  const [pay, setPay] = useState(order.payment_status);
  const [track, setTrack] = useState({ courier: order.courier || '', tracking_number: order.tracking_number || '' });
  const [notes, setNotes] = useState(order.admin_notes || '');
  const [s1, run1] = useMutation();
  const [s2, run2] = useMutation();
  const [s3, run3] = useMutation();
  const [s4, run4] = useMutation();
  const closed = ['cancelled', 'returned'].includes(order.status);

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <section className="panel">
        <div className="panel__head"><h3>Order Status</h3></div>
        <form className="panel__body" style={{ display: 'grid', gap: 12 }} onSubmit={async (e) => { e.preventDefault(); await run1(url, { method: 'PATCH', body: { action: 'status', status, note } }).catch(() => {}); setNote(''); }}>
          <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
            {ORDER_STATUSES.map((s) => <option key={s} value={s} disabled={closed && !['cancelled', 'returned'].includes(s)}>{humanize(s)}</option>)}
          </select>
          <input className="input" placeholder="Note (optional, visible in history)" value={note} onChange={(e) => setNote(e.target.value)} />
          {['cancelled', 'returned'].includes(status) && !closed && <p className="hint" style={{ fontSize: 13, color: '#a46a00' }}>Stock for all items will be returned to inventory.</p>}
          <FormMessage state={s1} />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn--primary btn--sm" disabled={s1.busy || status === order.status}>Update status</button>
            {!closed && order.status !== 'delivered' && (
              <button type="button" className="btn btn--danger btn--sm" disabled={s1.busy} onClick={() => confirm('Cancel this order and restock its items?') && run1(url, { method: 'PATCH', body: { action: 'status', status: 'cancelled', note: 'Cancelled by admin' } }).catch(() => {})}>
                Cancel order
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="panel">
        <div className="panel__head"><h3>Payment</h3></div>
        <form className="panel__body" style={{ display: 'grid', gap: 12 }} onSubmit={(e) => { e.preventDefault(); run2(url, { method: 'PATCH', body: { action: 'payment', payment_status: pay } }).catch(() => {}); }}>
          <select className="select" value={pay} onChange={(e) => setPay(e.target.value)}>
            {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{humanize(s)}</option>)}
          </select>
          {order.payment_status === 'pending_verification' && <p className="hint" style={{ fontSize: 13 }}>Verify the transaction in your bank/wallet portal before marking as paid.</p>}
          <FormMessage state={s2} />
          <div><button className="btn btn--primary btn--sm" disabled={s2.busy || pay === order.payment_status}>Update payment</button></div>
        </form>
      </section>

      <section className="panel">
        <div className="panel__head"><h3>Shipping &amp; Tracking</h3></div>
        <form className="panel__body" style={{ display: 'grid', gap: 12 }} onSubmit={(e) => { e.preventDefault(); run3(url, { method: 'PATCH', body: { action: 'tracking', ...track, mark_shipped: e.nativeEvent.submitter?.dataset.ship === '1' } }).catch(() => {}); }}>
          <input className="input" list="couriers" placeholder="Courier (e.g. TCS, Leopards)" value={track.courier} onChange={(e) => setTrack({ ...track, courier: e.target.value })} />
          <datalist id="couriers">{['TCS', 'Leopards', 'M&P', 'PostEx', 'Trax', 'Call Courier', 'BlueEx', 'Pakistan Post'].map((c) => <option key={c} value={c} />)}</datalist>
          <input className="input" placeholder="Tracking number" value={track.tracking_number} onChange={(e) => setTrack({ ...track, tracking_number: e.target.value })} />
          <FormMessage state={s3} />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn--outline btn--sm" disabled={s3.busy}>Save</button>
            {!closed && !['shipped', 'delivered'].includes(order.status) && <button className="btn btn--primary btn--sm" data-ship="1" disabled={s3.busy || !track.tracking_number}>Save &amp; mark shipped</button>}
          </div>
        </form>
      </section>

      <section className="panel">
        <div className="panel__head"><h3>Internal Notes</h3></div>
        <form className="panel__body" style={{ display: 'grid', gap: 12 }} onSubmit={(e) => { e.preventDefault(); run4(url, { method: 'PATCH', body: { action: 'notes', admin_notes: notes } }).catch(() => {}); }}>
          <textarea className="textarea" style={{ minHeight: 80 }} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Only visible to admins" />
          <FormMessage state={s4} />
          <div><button className="btn btn--outline btn--sm" disabled={s4.busy}>Save notes</button></div>
        </form>
      </section>
    </div>
  );
}
