/**
 * pages/dashboard/piezas.jsx
 * -----------------------------------------
 * Piezas pequeñas compartidas por los paneles del Dashboard (2026-09-24).
 * Solo presentación: ningún dato se inventa aquí.
 */
import { urlArchivo } from '../../api/client';
import { variacionPct } from '../../utils/formato';

/**
 * Variación vs. el periodo anterior: ▲ verde / ▼ roja / = gris. Siempre con
 * flecha + texto (nunca solo color). Sin base de comparación: `sinBase`.
 */
export function Indicador({ valor, contexto, sinBase = 'sin datos para comparar' }) {
  const texto = variacionPct(valor);
  if (texto === null) return <span className="text-xs text-texto-suave">{sinBase}</span>;
  const n = Number(valor);
  const clase = n > 0 ? 'text-green-400' : n < 0 ? 'text-red-400' : 'text-texto-suave';
  const flecha = n > 0 ? '▲' : n < 0 ? '▼' : '=';
  return (
    <span className="text-xs">
      <span className={`font-semibold ${clase}`}>
        {flecha} {texto}
      </span>{' '}
      <span className="text-texto-suave">{contexto}</span>
    </span>
  );
}

/** Fila "etiqueta ....... valor" de las tarjetas. `punto` = color del marcador (clase bg-*). */
export function FilaDato({ etiqueta, valor, punto }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="flex items-center gap-2 text-texto-suave">
        {punto && <span className={`h-2 w-2 shrink-0 rounded-full ${punto}`} aria-hidden="true" />}
        {etiqueta}
      </span>
      <span className="font-semibold text-texto">{valor}</span>
    </div>
  );
}

/** Imagen del servicio (si tiene) o su inicial. */
export function IconoServicio({ nombre, imagenUrl }) {
  if (imagenUrl) {
    return <img src={urlArchivo(imagenUrl)} alt="" className="h-6 w-6 shrink-0 rounded object-cover" />;
  }
  return (
    <span className="grid h-6 w-6 shrink-0 place-items-center rounded bg-superficie-alta text-[11px] font-semibold text-texto-suave">
      {nombre?.[0]?.toUpperCase() || '?'}
    </span>
  );
}

/** Selector de opciones en fila (pestañas compactas). opciones = [{ valor, texto }]. */
export function Segmentos({ opciones, valor, onCambio, etiqueta }) {
  return (
    <div role="tablist" aria-label={etiqueta} className="inline-flex rounded-lg border border-borde bg-fondo p-0.5">
      {opciones.map((o) => (
        <button
          key={o.valor}
          role="tab"
          aria-selected={valor === o.valor}
          onClick={() => onCambio(o.valor)}
          className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
            valor === o.valor ? 'bg-marca-500 text-fondo' : 'text-texto-suave hover:text-texto'
          }`}
        >
          {o.texto}
        </button>
      ))}
    </div>
  );
}
