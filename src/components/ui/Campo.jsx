/** Input con etiqueta y mensaje de error opcional. */
export function Campo({ etiqueta, error, className = '', id, ...props }) {
  const idInput = id || props.name || etiqueta;
  return (
    <label className={`block ${className}`} htmlFor={idInput}>
      {etiqueta && <span className="mb-1 block text-sm font-medium text-texto-suave">{etiqueta}</span>}
      <input
        id={idInput}
        className={`w-full rounded-lg border bg-superficie-alta px-3 py-2 text-sm text-texto outline-none transition
          placeholder:text-texto-suave/60
          focus:border-marca-500 focus:ring-2 focus:ring-marca-500/30
          ${error ? 'border-red-500' : 'border-borde'}`}
        {...props}
      />
      {error && <span className="mt-1 block text-xs text-red-400">{error}</span>}
    </label>
  );
}
