'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Icon from '@/components/Icon';
import { api } from '@/lib/client-api';
import { ConfirmDialog, FormMessage, Modal, SingleImage, Toggle, useMutation } from './ui';

export const EMPTY_CATEGORY = { name: '', menu_label: '', slug: '', parent_id: '', description: '', image: '', status: 'active', show_in_menu: false, show_on_home: false, sort_order: 0, seo_title: '', seo_description: '' };

export function toCategoryForm(c) {
  return { ...EMPTY_CATEGORY, ...c, parent_id: c.parent_id || '', show_in_menu: !!c.show_in_menu, show_on_home: !!c.show_on_home, menu_label: c.menu_label || '', description: c.description || '', image: c.image || '', seo_title: c.seo_title || '', seo_description: c.seo_description || '' };
}

export function CategoryForm({ initial, categories, onClose }) {
  const [c, setC] = useState(initial);
  const [state, run] = useMutation();
  const set = (k, v) => setC((x) => ({ ...x, [k]: v }));
  return (
    <Modal title={initial.id ? `Edit “${initial.name}”` : 'Add Category'} onClose={onClose}>
      <form
        className="form-grid"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await run(initial.id ? `/api/admin/categories/${initial.id}` : '/api/admin/categories', { method: initial.id ? 'PUT' : 'POST', body: c });
            onClose();
          } catch {}
        }}
      >
        <div className="field"><label>Category name *</label><input className="input" required value={c.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Peshawari Chappals" /></div>
        <div className="field">
          <label>Put it inside</label>
          <select className="select" value={c.parent_id || ''} onChange={(e) => set('parent_id', e.target.value)}>
            <option value="">— Nothing (main category) —</option>
            {categories.filter((x) => x.id !== initial.id && !x.parent_id).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
          </select>
        </div>
        <div className="field span-2"><label>Short description</label><textarea className="textarea" style={{ minHeight: 70 }} value={c.description || ''} onChange={(e) => set('description', e.target.value)} placeholder="Shown at the top of the category page" /></div>
        <div className="field span-2"><span className="label">Picture</span><SingleImage value={c.image} onChange={(v) => set('image', v)} folder="categories" /></div>
        <div style={{ display: 'grid', gap: 10 }} className="span-2">
          <Toggle checked={c.status === 'active'} onChange={(v) => set('status', v ? 'active' : 'inactive')} label="Show this category in the shop" />
          <Toggle checked={c.show_in_menu} onChange={(v) => set('show_in_menu', v)} label="Show in the top menu (Men, Women, Kids…)" />
          <Toggle checked={c.show_on_home} onChange={(v) => set('show_on_home', v)} label="Show on the homepage (“Shop by Category”)" />
        </div>
        {c.show_in_menu && <div className="field"><label>Short name for the menu</label><input className="input" value={c.menu_label || ''} placeholder={c.name} onChange={(e) => set('menu_label', e.target.value)} /></div>}
        <div className="span-2"><FormMessage state={state} /></div>
        <div className="span-2" style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn--primary" disabled={state.busy}>{state.busy ? 'Saving…' : 'Save category'}</button>
          <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </Modal>
  );
}

/** Asks what to do with a category's products, then deletes the category. */
export function DeleteCategoryDialog({ category, categories, onClose, onDone }) {
  const [info, setInfo] = useState(null);
  const [choice, setChoice] = useState('move');
  const [target, setTarget] = useState('');
  const [state, run] = useMutation();

  useEffect(() => {
    api(`/api/admin/categories/${category.id}`).then(setInfo).catch((e) => setInfo({ error: e.message }));
  }, [category.id]);

  const others = categories.filter((c) => c.id !== category.id);
  const confirmText =
    choice === 'move' ? 'Move products & delete category' : choice === 'delete' ? `Delete category and ${info?.exclusive ?? ''} products` : 'Delete category only';

  return (
    <ConfirmDialog
      title={`Delete category “${category.name}”?`}
      confirmLabel={confirmText}
      busy={state.busy}
      error={state.error || info?.error}
      onClose={onClose}
      onConfirm={async () => {
        if (choice === 'move' && !target) return alert('Please choose where to move the products.');
        try {
          await run(`/api/admin/categories/${category.id}`, { method: 'DELETE', body: { products: choice, target_id: target || undefined } });
          onDone?.();
          onClose();
        } catch {}
      }}
    >
      {!info ? (
        <p className="muted">Checking products…</p>
      ) : info.total === 0 ? (
        <p>This category has no products of its own, so nothing else is affected.{info.subcategories > 0 && <> Its {info.subcategories} sub-categor{info.subcategories === 1 ? 'y becomes a main category' : 'ies become main categories'}.</>}</p>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          <p>
            This category has <b>{info.total} product{info.total === 1 ? '' : 's'}</b>
            {info.shared > 0 && <> ({info.shared} of them also {info.shared === 1 ? 'appears' : 'appear'} in other categories)</>}. What should happen to {info.total === 1 ? 'it' : 'them'}?
          </p>
          <label className={`choice ${choice === 'move' ? 'is-active' : ''}`}>
            <input type="radio" name="del" checked={choice === 'move'} onChange={() => setChoice('move')} />
            <span style={{ flex: 1 }}>
              <b>Move the products to another category</b>
              <small>Recommended. Nothing is deleted except the category.</small>
              {choice === 'move' && (
                <select className="select" style={{ marginTop: 8, height: 40 }} value={target} onChange={(e) => setTarget(e.target.value)}>
                  <option value="">Choose a category…</option>
                  {others.map((c) => <option key={c.id} value={c.id}>{c.parent_name ? `${c.parent_name} › ` : ''}{c.name}</option>)}
                </select>
              )}
            </span>
          </label>
          <label className={`choice ${choice === 'keep' ? 'is-active' : ''}`}>
            <input type="radio" name="del" checked={choice === 'keep'} onChange={() => setChoice('keep')} />
            <span><b>Keep the products in the shop</b><small>They stay for sale, just without this category.</small></span>
          </label>
          <label className={`choice ${choice === 'delete' ? 'is-active' : ''}`}>
            <input type="radio" name="del" checked={choice === 'delete'} onChange={() => setChoice('delete')} />
            <span>
              <b>Delete the products too</b>
              <small>
                {info.exclusive} product{info.exclusive === 1 ? '' : 's'} will be deleted permanently.
                {info.shared > 0 && ` ${info.shared} product${info.shared === 1 ? ' that is' : 's that are'} also in other categories will be kept there.`}
              </small>
            </span>
          </label>
          {info.subcategories > 0 && <p className="help">Its {info.subcategories} sub-categor{info.subcategories === 1 ? 'y' : 'ies'} will become main categories.</p>}
          <p className="help">Past orders are never affected.</p>
        </div>
      )}
    </ConfirmDialog>
  );
}

function MoveButtons({ id }) {
  const router = useRouter();
  const move = async (dir) => {
    await api(`/api/admin/categories/${id}`, { method: 'PATCH', body: { move: dir } });
    router.refresh();
  };
  return (
    <span style={{ display: 'inline-flex', gap: 4 }}>
      <button type="button" className="icon-action" style={{ width: 30, height: 30 }} onClick={() => move('up')} aria-label="Move up" title="Move up"><Icon name="chevronDown" size={15} style={{ transform: 'rotate(180deg)' }} /></button>
      <button type="button" className="icon-action" style={{ width: 30, height: 30 }} onClick={() => move('down')} aria-label="Move down" title="Move down"><Icon name="chevronDown" size={15} /></button>
    </span>
  );
}

export default function CategoryManager({ categories }) {
  const router = useRouter();
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const roots = categories.filter((c) => !c.parent_id || !categories.some((p) => p.id === c.parent_id));
  const rows = roots.flatMap((r) => [r, ...categories.filter((c) => c.parent_id === r.id)]);

  return (
    <>
      <div className="page-bar">
        <div>
          <h1>Categories</h1>
          <p>Click “Open” to see a category’s products. Use the arrows to change the order customers see.</p>
        </div>
        <button className="btn btn--primary" onClick={() => setEditing(EMPTY_CATEGORY)}><Icon name="plus" size={18} /> Add Category</button>
      </div>
      <section className="panel">
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Category</th><th>Products</th><th>Order</th><th>Where it shows</th><th className="text-right">Actions</th></tr></thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div className="cell-product" style={{ paddingLeft: c.parent_id ? 28 : 0 }}>
                      <span className="thumb">{c.image && <Image src={c.image} alt="" fill sizes="48px" />}</span>
                      <span>
                        <Link href={`/admin/categories/${c.id}`}><b>{c.parent_id ? '↳ ' : ''}{c.name}</b></Link>
                        {c.status !== 'active' && <small style={{ color: 'var(--red)' }}>Hidden from shop</small>}
                      </span>
                    </div>
                  </td>
                  <td><b style={{ fontSize: 16 }}>{c.product_count}</b></td>
                  <td><MoveButtons id={c.id} /></td>
                  <td style={{ fontSize: 13 }}>
                    {[c.show_in_menu && 'Top menu', c.show_on_home && 'Homepage'].filter(Boolean).join(', ') || <span className="muted">Category page only</span>}
                  </td>
                  <td>
                    <div className="row-actions">
                      <Link href={`/admin/categories/${c.id}`} className="btn btn--primary btn--sm">Open</Link>
                      <button className="btn btn--outline btn--sm" onClick={() => setEditing(toCategoryForm(c))}><Icon name="edit" size={15} /> Edit</button>
                      <button className="icon-action icon-action--danger" title="Delete category" aria-label={`Delete ${c.name}`} onClick={() => setDeleting(c)}><Icon name="trash" size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!rows.length && <tr><td colSpan={5} className="muted" style={{ textAlign: 'center', padding: 40 }}>No categories yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
      {editing && <CategoryForm initial={editing} categories={categories} onClose={() => setEditing(null)} />}
      {deleting && <DeleteCategoryDialog category={deleting} categories={categories} onClose={() => setDeleting(null)} onDone={() => router.refresh()} />}
    </>
  );
}
