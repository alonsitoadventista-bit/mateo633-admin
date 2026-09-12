/** Input con etiqueta y mensaje de error opcional. */
export function Campo({ etiqueta, error, className = '', id, ...props }) {
  const idInput = id || props.name || etiqueta;
  return (
    <label className={`block ${className}`} htmlFor={idInput}>
      {etiqueta && <span className="mb-1 block text-sm font-medium text-slate-700">{etiqueta}</span>}
      <input
        id={idInput}
        className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition
          focus:border-marca-500 focus:ring-2 focus:ring-marca-500/30
          ${error ? 'border-red-400' : 'border-slate-300'}`}
        {...props}
      />
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}
