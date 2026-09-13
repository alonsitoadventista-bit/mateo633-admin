import { useEffect } from 'react';

export function Modal({ abierto, titulo, onCerrar, children, pie }) {
  useEffect(() => {
    if (!abierto) return;
    const alPresionar = (e) => e.key === 'Escape' && onCerrar?.();
    window.addEventListener('keydown', alPresionar);
    return () => window.removeEventListener('keydown', alPresionar);
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onCerrar}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-borde bg-superficie shadow-2xl shadow-black/50"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <header className="flex items-center justify-between border-b border-borde px-4 py-3">
          <h2 className="text-sm font-semibold text-texto">{titulo}</h2>
          <button
            onClick={onCerrar}
            className="rounded p-1 text-texto-suave hover:bg-superficie-alta hover:text-texto"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </header>
        <div className="px-4 py-4 text-texto">{children}</div>
        {pie && <footer className="flex justify-end gap-2 border-t border-borde px-4 py-3">{pie}</footer>}
      </div>
    </div>
  );
}
