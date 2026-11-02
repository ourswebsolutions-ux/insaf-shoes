'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Icon from '@/components/Icon';
import { api } from '@/lib/client-api';
import { formatPrice } from '@/lib/format';
import { ConfirmDialog, Toggle } from './ui';

function StatusToggle({ product }) {
  const router = useRouter();
  const [on, setOn] = useState(product.status === 'active');
  const [busy, setBusy] = useState(false);
  return (
    <Toggle
      checked={on}
      disabled={busy}
      label={on ? 'Shown' : 'Hidden'}
      onChange={async (v) => {
        setBusy(true);
        setOn(v);
        try {
          await api(`/api/admin/products/${product.id}`, { method: 'PATCH', body: { status: v ? 'active' : 'inactive' } });
          router.refresh();
        } catch (e) {
          setOn(!v);
          alert(e.message);
        } finally {
          setBusy(false);
        }
      }}
    />
  );
}

/**
 * Product table with checkboxes. Selected products can be shown, hidden or
 * deleted together; every deletion is confirmed with the exact count first.
 */
export default function ProductsTable({ products, emptyText = 'No products found.' }) {
  const router = useRouter();
  const [selected, setSelected] = useState(() => new Set());
  const [confirm, setConfirm] = useState(null); // { ids, names }
  const [state, setState] = useState({ busy: false, error: null, message: null });

  const ids = useMemo(() => products.map((p) => p.id), [products]);
  const chosen = ids.filter((id) => selected.has(id));
  const allChecked = chosen.length > 0 && chosen.length === ids.length;

  const toggle = (id) =>
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  async function bulk(action, list) {
    setState({ busy: true, error: null, message: null });
    try {
      const res = await api('/api/admin/products/bulk', { method: 'POST', body: { action, ids: list } });
      setState({ busy: false, error: null, message: res.message });
      setSelected(new Set());
      setConfirm(null);
      router.refresh();
    } catch (e) {
      setState({ busy: false, error: e.message, message: null });
    }
  }

  const askDelete = (list) => setConfirm({ ids: list, names: products.filter((p) => list.includes(p.id)).map((p) => p.name) });

  return (
    <>
      {state.message && <p className="form-success" style={{ margin: 16 }}>{state.message}</p>}
      {chosen.length > 0 && (
        <div className="bulk-bar" role="region" aria-label="Selected products">
          <b>{chosen.length} selected</b>
          <button className="btn btn--outline btn--sm" disabled={state.busy} onClick={() => bulk('show', chosen)}><Icon name="eye" size={15} /> Show in shop</button>
          <button className="btn btn--outline btn--sm" disabled={state.busy} onClick={() => bulk('hide', chosen)}>Hide from shop</button>
          <button className="btn btn--danger-solid btn--sm" disabled={state.busy} onClick={() => askDelete(chosen)}><Icon name="trash" size={15} /> Delete selected</button>
          <button className="btn btn--ghost btn--sm" onClick={() => setSelected(new Set())}>Clear</button>
        </div>
      )}
      <div className="table-wrap">
        <table className="table table--cards">
          <thead>
            <tr>
              <th className="check">
                <input type="checkbox" aria-label="Select all products on this page" checked={allChecked} disabled={!ids.length} onChange={(e) => setSelected(e.target.checked ? new Set(ids) : new Set())} />
              </th>
              <th>Product</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>In shop</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className={selected.has(p.id) ? 'is-selected' : ''}>
                <td className="check">
                  <input type="checkbox" aria-label={`Select ${p.name}`} checked={selected.has(p.id)} onChange={() => toggle(p.id)} />
                </td>
                <td className="cell-main">
                  <div className="cell-product">
                    <span className="thumb">{p.image && <Image src={p.image} alt="" fill sizes="48px" />}</span>
                    <span>
                      <Link href={`/admin/products/${p.id}`}><b>{p.name}</b></Link>
                      <small>Code: {p.sku}</small>
                    </span>
                  </div>
                </td>
                <td className="hide-sm">
                  <div className="cat-tags">{p.categories.map((c) => <span key={c} className="cat-tag">{c}</span>)}</div>
                </td>
                <td className="cell-extra nowrap">
                  {p.sale_price ? <><b>{formatPrice(p.sale_price)}</b> <s className="muted" style={{ fontSize: 12 }}>{formatPrice(p.price)}</s></> : <b>{formatPrice(p.price)}</b>}
                </td>
                <td className="cell-extra">
                  <span className={`status ${p.stock === 0 ? 'status--cancelled' : p.stock <= p.low_stock_threshold ? 'status--pending' : 'status--active'}`}>
                    {p.stock === 0 ? 'Out of stock' : `${p.stock} in stock`}
                  </span>
                </td>
                <td className="hide-sm"><StatusToggle key={p.status} product={p} /></td>
                <td className="cell-actions">
                  <div className="row-actions">
                    <Link href={`/admin/products/${p.id}`} className="btn btn--outline btn--sm"><Icon name="edit" size={15} /> Edit</Link>
                    <button className="icon-action icon-action--danger" title="Delete" aria-label={`Delete ${p.name}`} onClick={() => askDelete([p.id])}>
                      <Icon name="trash" size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!products.length && (
              <tr><td colSpan={7} className="muted" style={{ textAlign: 'center', padding: 40 }}>{emptyText}</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {confirm && (
        <ConfirmDialog
          title={confirm.ids.length === 1 ? 'Delete this product?' : `Delete ${confirm.ids.length} products?`}
          confirmLabel={confirm.ids.length === 1 ? 'Yes, delete product' : `Yes, delete ${confirm.ids.length} products`}
          busy={state.busy}
          error={state.error}
          onClose={() => { setConfirm(null); setState((s) => ({ ...s, error: null })); }}
          onConfirm={() => bulk('delete', confirm.ids)}
        >
          <p>
            {confirm.ids.length === 1 ? <>“<b>{confirm.names[0]}</b>” will be removed from your shop permanently.</> : <>These <b>{confirm.ids.length} products</b> will be removed from your shop permanently:</>}
          </p>
          {confirm.ids.length > 1 && (
            <ul style={{ margin: '8px 0', paddingLeft: 20, maxHeight: 160, overflowY: 'auto', listStyle: 'disc', fontSize: 14 }}>
              {confirm.names.map((n, i) => <li key={i}>{n}</li>)}
            </ul>
          )}
          <p className="help" style={{ marginTop: 8 }}>Past orders are not affected – they keep the product name, size and price. This cannot be undone. If you only want to stop selling it for now, use “Hide from shop” instead.</p>
        </ConfirmDialog>
      )}
    </>
  );
}
