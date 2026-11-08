'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/Icon';
import { formatPrice } from '@/lib/format';
import { api } from '../ShopProvider';

export default function PaymentActions({ order, token, bank }) {
  const router = useRouter();
  const [form, setForm] = useState({ transaction_ref: '', payer_account: '' });
  const [state, setState] = useState({ status: 'idle' });
  const closed = ['cancelled', 'returned'].includes(order.status);

  if (closed || ['paid', 'refunded', 'unpaid'].includes(order.payment_status)) return null;

  if (order.payment_method === 'bank_transfer') {
    return (
      <section className="panel">
        <div className="panel__head"><h3>Complete Your Payment</h3></div>
        <div className="panel__body" style={{ display: 'grid', gap: 16 }}>
          <p style={{ fontSize: 14 }}>
            Send <b>{formatPrice(order.total)}</b> to any one of the accounts below and use <b>{order.order_number}</b> as the reference.
          </p>
          {bank.account_number && (
            <dl className="kv">
              <dt>Bank</dt><dd>{bank.bank_name}</dd>
              <dt>Account title</dt><dd>{bank.account_title}</dd>
              <dt>Account no.</dt><dd>{bank.account_number}</dd>
              {bank.iban && (<><dt>IBAN</dt><dd style={{ wordBreak: 'break-all' }}>{bank.iban}</dd></>)}
            </dl>
          )}
          {bank.jazzcash_number && (
            <dl className="kv">
              <dt>JazzCash</dt><dd>{bank.jazzcash_number}</dd>
              {bank.jazzcash_title && (<><dt>Account title</dt><dd>{bank.jazzcash_title}</dd></>)}
            </dl>
          )}
          {bank.easypaisa_number && (
            <dl className="kv">
              <dt>Easypaisa</dt><dd>{bank.easypaisa_number}</dd>
              {bank.easypaisa_title && (<><dt>Account title</dt><dd>{bank.easypaisa_title}</dd></>)}
            </dl>
          )}
          {bank.instructions && <p style={{ fontSize: 14, color: 'var(--muted)' }}>{bank.instructions}</p>}
          {order.payment_status === 'pending_verification' && state.status !== 'done' ? (
            <p className="notice notice--green"><Icon name="clock" /> We’ve received your payment details and are verifying them.</p>
          ) : state.status === 'done' ? (
            <p className="form-success">{state.message}</p>
          ) : (
            <form
              className="form-grid"
              onSubmit={async (e) => {
                e.preventDefault();
                setState({ status: 'loading' });
                try {
                  const res = await api(`/api/orders/${order.order_number}/payment`, { method: 'POST', body: { ...form, t: token } });
                  setState({ status: 'done', message: res.message });
                  router.refresh();
                } catch (err) {
                  setState({ status: 'error', message: err.message });
                }
              }}
            >
              <div className="field">
                <label htmlFor="pa-ref">Transaction ID / reference *</label>
                <input id="pa-ref" className="input" required value={form.transaction_ref} onChange={(e) => setForm({ ...form, transaction_ref: e.target.value })} />
              </div>
              <div className="field">
                <label htmlFor="pa-acc">Paid from (account / name)</label>
                <input id="pa-acc" className="input" value={form.payer_account} onChange={(e) => setForm({ ...form, payer_account: e.target.value })} />
              </div>
              {state.status === 'error' && <p className="form-error span-2">{state.message}</p>}
              <div className="span-2">
                <button className="btn btn--primary" disabled={state.status === 'loading'}>Submit payment details</button>
              </div>
            </form>
          )}
        </div>
      </section>
    );
  }

  if (['jazzcash', 'easypaisa'].includes(order.payment_method)) {
    if (order.payment_status === 'pending_verification')
      return <p className="notice notice--green"><Icon name="clock" /> Your payment was submitted and is being verified.</p>;
    const label = order.payment_method === 'jazzcash' ? 'JazzCash' : 'Easypaisa';
    return (
      <div className="notice">
        <Icon name="alert" />
        <div>
          {order.payment_status === 'failed' ? `Your ${label} payment was not completed.` : `Your order is awaiting ${label} payment.`}{' '}
          {token && (
            <a className="btn btn--primary btn--sm" style={{ marginLeft: 8 }} href={`/api/payments/${order.payment_method}/start?order=${order.order_number}&t=${token}`}>
              Pay {formatPrice(order.total)} with {label}
            </a>
          )}
        </div>
      </div>
    );
  }
  return null;
}
