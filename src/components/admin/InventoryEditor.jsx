'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FormMessage, useMutation } from './ui';

export default function InventoryEditor({ rows }) {
  const [edits, setEdits] = useState({});
  const [state, run] = useMutation();
  const changed = Object.entries(edits).filter(([id, v]) => rows.find((r) => r.id === Number(id))?.stock !== v);

  return (
    <section className="panel">
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Product</th><th>Variant</th><th>SKU</th><th>Stock</th><th>Quick adjust</th></tr></thead>
          <tbody>
            {rows.map((r) => {
              const v = edits[r.id] ?? r.stock;
              return (
                <tr key={r.id}>
                  <td>
                    <div className="cell-product">
                      <span className="thumb">{r.image && <Image src={r.image} alt="" fill sizes="48px" />}</span>
                      <span><Link href={`/admin/products/${r.product_id}`}><b>{r.name}</b></Link><small>{r.product_status === 'inactive' ? 'Inactive product' : ''}</small></span>
                    </div>
                  </td>
                  <td>{[r.size && `Size ${r.size}`, r.color].filter(Boolean).join(' · ') || 'Default'}</td>
                  <td className="muted">{r.sku}</td>
                  <td>
                    <input className="input" type="number" min="0" style={{ width: 90, height: 38, borderColor: v !== r.stock ? 'var(--green-500)' : undefined }} value={v} onChange={(e) => setEdits({ ...edits, [r.id]: Math.max(0, Number(e.target.value) || 0) })} aria-label="Stock" />
                    {v === 0 ? <span className="status status--cancelled" style={{ marginLeft: 8 }}>Out</span> : v <= r.low_stock_threshold ? <span className="status status--pending" style={{ marginLeft: 8 }}>Low</span> : null}
                  </td>
                  <td className="nowrap">
                    {[-1, 5, 10, 25].map((d) => (
                      <button key={d} type="button" className="btn btn--ghost btn--sm" style={{ padding: '0 10px', marginRight: 4 }} onClick={() => setEdits({ ...edits, [r.id]: Math.max(0, v + d) })}>{d > 0 ? `+${d}` : d}</button>
                    ))}
                  </td>
                </tr>
              );
            })}
            {!rows.length && <tr><td colSpan={5} className="muted" style={{ textAlign: 'center', padding: 40 }}>No variants match.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="sticky-save" style={{ padding: '14px 16px', background: '#fff', borderTop: '1px solid var(--line-2)' }}>
        <FormMessage state={state} />
        <button className="btn btn--ghost btn--sm" disabled={!changed.length} onClick={() => setEdits({})}>Discard</button>
        <button
          className="btn btn--primary btn--sm"
          disabled={!changed.length || state.busy}
          onClick={async () => {
            await run('/api/admin/inventory', { method: 'PATCH', body: { updates: changed.map(([id, stock]) => ({ id: Number(id), stock })) } }).catch(() => {});
            setEdits({});
          }}
        >
          Save {changed.length || ''} change{changed.length === 1 ? '' : 's'}
        </button>
      </div>
    </section>
  );
}
