/** Select con etiqueta. `opciones` = [{ valor, texto }] o strings. */
export function Selector({ etiqueta, opciones = [], placeholder, className = '', id, ...props }) {
  const idInput = id || props.name || etiqueta;
  const normalizadas = opciones.map((o) => (typeof o === 'string' ? { valor: o, texto: o } : o));
  return (
    <label className={`block ${className}`} htmlFor={idInput}>
      {etiqueta && <span className="mb-1 block text-sm font-medium text-slate-700">{etiqueta}</span>}
      <select
        id={idInput}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none
          transition focus:border-marca-500 focus:ring-2 focus:ring-marca-500/30"
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {normalizadas.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.texto}
          </option>
        ))}
      </select>
    </label>
  );
}
