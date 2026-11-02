'use client';

import { useMutation } from './ui';

/** A button that sends one PATCH/POST and refreshes the page. */
export function ActionButton({ url, body, method = 'PATCH', children, className = 'btn btn--outline btn--sm', confirmText }) {
  const [state, run] = useMutation();
  return (
    <button
      type="button"
      className={className}
      disabled={state.busy}
      onClick={() => {
        if (confirmText && !confirm(confirmText)) return;
        run(url, { method, body }).catch((e) => alert(e.message));
      }}
    >
      {children}
    </button>
  );
}
