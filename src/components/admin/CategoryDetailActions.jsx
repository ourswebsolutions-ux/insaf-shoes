'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/Icon';
import { api } from '@/lib/client-api';
import { CategoryForm, DeleteCategoryDialog, toCategoryForm } from './CategoryManager';
import { ConfirmDialog, useMutation } from './ui';

function DeleteAllProductsDialog({ category, onClose }) {
  const [info, setInfo] = useState(null);
  const [mode, setMode] = useState('all');
  const [state, run] = useMutation();

  useEffect(() => {
    api(`/api/admin/categories/${category.id}/products`).then(setInfo).catch((e) => setInfo({ error: e.message }));
  }, [category.id]);

  const count = info ? (mode === 'all' ? info.total : info.exclusive) : 0;

  return (
    <ConfirmDialog
      title={`Delete all products in “${category.name}”?`}
      confirmLabel={info ? `Yes, delete ${count} product${count === 1 ? '' : 's'}` : 'Please wait…'}
      busy={state.busy || !info}
      error={state.error || info?.error}
      onClose={onClose}
      onConfirm={async () => {
        try {
          await run(`/api/admin/categories/${category.id}/products`, { method: 'DELETE', body: { mode, expected: count } });
          onClose();
        } catch {}
      }}
    >
      {!info ? (
        <p className="muted">Counting products…</p>
      ) : info.total === 0 ? (
        <p>This category has no products.</p>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          <p>
            This category{category.has_children ? ' (with its sub-categories)' : ''} has <b>{info.total} product{info.total === 1 ? '' : 's'}</b>. The category itself will stay.
          </p>
          {info.shared > 0 ? (
            <>
              <label className={`choice ${mode === 'all' ? 'is-active' : ''}`}>
                <input type="radio" name="mode" checked={mode === 'all'} onChange={() => setMode('all')} />
                <span><b>Delete all {info.total} products</b><small>Including {info.shared} that also appear in other categories – they will disappear from those too.</small></span>
              </label>
              <label className={`choice ${mode === 'exclusive' ? 'is-active' : ''}`}>
                <input type="radio" name="mode" checked={mode === 'exclusive'} onChange={() => setMode('exclusive')} />
                <span><b>Delete only the {info.exclusive} products that are just in this category</b><small>The other {info.shared} are removed from this category but stay in the shop under their other categories.</small></span>
              </label>
            </>
          ) : (
            <p>All {info.total} products will be <b>permanently deleted</b>.</p>
          )}
          <p className="help">Past orders are not affected. This cannot be undone.</p>
        </div>
      )}
    </ConfirmDialog>
  );
}

export default function CategoryDetailActions({ category, categories, productCount }) {
  const router = useRouter();
  const [dialog, setDialog] = useState(null);
  return (
    <>
      <div className="page-bar__actions">
        <a href={`/category/${category.slug}`} target="_blank" className="btn btn--outline btn--sm"><Icon name="eye" size={15} /> View in shop</a>
        <button className="btn btn--outline btn--sm" onClick={() => setDialog('edit')}><Icon name="edit" size={15} /> Edit category</button>
        <button className="btn btn--danger btn--sm" disabled={!productCount} onClick={() => setDialog('products')}><Icon name="trash" size={15} /> Delete All Products in This Category</button>
        <button className="btn btn--danger btn--sm" onClick={() => setDialog('category')}>Delete category</button>
      </div>
      {dialog === 'edit' && <CategoryForm initial={toCategoryForm(category)} categories={categories} onClose={() => setDialog(null)} />}
      {dialog === 'products' && <DeleteAllProductsDialog category={category} onClose={() => setDialog(null)} />}
      {dialog === 'category' && (
        <DeleteCategoryDialog category={category} categories={categories} onClose={() => setDialog(null)} onDone={() => router.push('/admin/categories')} />
      )}
    </>
  );
}
