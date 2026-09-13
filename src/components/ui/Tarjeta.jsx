export function Tarjeta({ titulo, acciones, className = '', children }) {
  return (
    <section className={`rounded-2xl border border-borde bg-superficie shadow-lg shadow-black/30 ${className}`}>
      {(titulo || acciones) && (
        <header className="flex items-center justify-between gap-3 border-b border-borde px-4 py-3">
          {titulo && <h2 className="text-sm font-semibold text-texto">{titulo}</h2>}
          {acciones && <div className="flex items-center gap-2">{acciones}</div>}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

const BADGE_ICONO = {
  dorado: 'bg-marca-500/15 text-marca-400',
  rojo: 'bg-red-500/15 text-red-400',
  verde: 'bg-green-500/15 text-green-400',
  azul: 'bg-blue-500/15 text-blue-400',
};

/**
 * Métrica compacta para el dashboard. `icono` es opcional (un <IconoNav/>
 * u otro nodo); `colorIcono` = dorado (default) | rojo | verde | azul,
 * para distinguir de un vistazo el tipo de indicador (ej. rojo para
 * "pagos por revisar", verde para "ingresos").
 */
export function TarjetaMetrica({ etiqueta, valor, pie, icono, colorIcono = 'dorado' }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-borde bg-superficie p-4 shadow-lg shadow-black/30 transition hover:border-marca-500/25">
      <div className="relative flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-texto-suave">{etiqueta}</p>
        {icono && (
          <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${BADGE_ICONO[colorIcono] || BADGE_ICONO.dorado}`}>
            {icono}
          </span>
        )}
      </div>
      <p className="relative mt-3 text-2xl font-bold text-texto">{valor}</p>
      {pie && <p className="relative mt-1 text-xs text-texto-suave">{pie}</p>}
    </div>
  );
}
