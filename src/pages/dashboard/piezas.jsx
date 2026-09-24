/**
 * pages/dashboard/piezas.jsx
 * -----------------------------------------
 * Piezas compartidas por los paneles del Dashboard (2026-09-24).
 * Fase visual: panel con encabezado de ícono, botones-enlace tipo "pill",
 * íconos de servicio con color de marca y selector de segmentos.
 * Solo presentación: ningún dato se inventa aquí.
 */
import { Link } from 'react-router-dom';
import { urlArchivo } from '../../api/client';
import { IconoNav } from '../../components/IconoNav.jsx';
import { variacionPct } from '../../utils/formato';

/** Colores del ícono de encabezado de cada panel (fondo en degradado + brillo). */
const TONO_ICONO = {
  dorado: 'from-marca-400 to-marca-700 text-fondo shadow-marca-500/30',
  azul: 'from-sky-400 to-blue-600 text-white shadow-blue-500/30',
  verde: 'from-emerald-400 to-green-600 text-white shadow-green-500/30',
  ambar: 'from-amber-300 to-amber-600 text-fondo shadow-amber-500/30',
  rojo: 'from-rose-400 to-red-600 text-white shadow-red-500/30',
  violeta: 'from-violet-400 to-purple-600 text-white shadow-purple-500/30',
  naranja: 'from-orange-400 to-red-500 text-white shadow-orange-500/30',
};

/** Cuadro de ícono en degradado (encabezados y tarjetas). */
export function IconoTile({ icono, tono = 'dorado', tamano = 'md' }) {
  const medida = tamano === 'lg' ? 'h-12 w-12 rounded-2xl' : 'h-10 w-10 rounded-xl';
  const icon = tamano === 'lg' ? 'h-6 w-6' : 'h-5 w-5';
  return (
    <span className={`grid shrink-0 place-items-center bg-gradient-to-br shadow-lg ${medida} ${TONO_ICONO[tono] || TONO_ICONO.dorado}`}>
      <IconoNav nombre={icono} className={icon} />
    </span>
  );
}

/**
 * Panel del dashboard: superficie oscura con degradado sutil, borde fino y
 * encabezado con ícono + título + subtítulo opcional + acciones a la derecha.
 */
export function PanelDash({ id, icono, tono, titulo, subtitulo, acciones, children, className = '' }) {
  return (
    <section
      id={id}
      className={`relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-b from-[#16171b] to-[#0e0f12] p-5 shadow-[0_18px_40px_-20px_rgba(0,0,0,0.9)] ${className}`}
    >
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {icono && <IconoTile icono={icono} tono={tono} />}
          <div className="min-w-0">
            <h2 className="text-base font-semibold tracking-tight text-texto">{titulo}</h2>
            {subtitulo && <p className="text-xs text-texto-suave">{subtitulo}</p>}
          </div>
        </div>
        {acciones && <div className="flex flex-wrap items-center gap-2">{acciones}</div>}
      </header>
      <div className="flex-1">{children}</div>
    </section>
  );
}

/** Botón-enlace tipo "pill": "Ver todos ›". */
export function EnlacePill({ to, children }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-texto transition hover:border-marca-500/50 hover:text-marca-400"
    >
      {children}
      <IconoNav nombre="flecha" className="h-3.5 w-3.5" />
    </Link>
  );
}

/**
 * Variación vs. el periodo anterior: ▲ verde / ▼ roja / = gris. Siempre con
 * flecha + texto (nunca solo color). Sin base de comparación: `sinBase`.
 */
export function Indicador({ valor, contexto, sinBase = 'sin datos para comparar' }) {
  const texto = variacionPct(valor);
  if (texto === null) return <span className="text-xs text-texto-suave">{sinBase}</span>;
  const n = Number(valor);
  const clase = n > 0 ? 'text-green-400' : n < 0 ? 'text-red-400' : 'text-texto-suave';
  const flecha = n > 0 ? '↑' : n < 0 ? '↓' : '=';
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
export function FilaDato({ etiqueta, valor, punto, icono }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="flex min-w-0 items-center gap-2 text-texto/85">
        {punto && <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${punto}`} aria-hidden="true" />}
        {icono && <IconoNav nombre={icono} className="h-4 w-4 shrink-0 text-texto-suave" />}
        <span className="truncate">{etiqueta}</span>
      </span>
      <span className="font-semibold tabular-nums text-texto">{valor}</span>
    </div>
  );
}

/**
 * Color de marca por servicio (solo el color del cuadro con la inicial; no
 * son logos oficiales). Si el servicio tiene imagen cargada, se usa la imagen.
 */
const COLOR_MARCA = [
  [/netflix/i, 'bg-[#e50914] text-white'],
  [/disney/i, 'bg-[#113ccf] text-white'],
  [/hbo|max/i, 'bg-[#5b2ee5] text-white'],
  [/prime|amazon/i, 'bg-[#00a8e1] text-white'],
  [/youtube/i, 'bg-[#ff0000] text-white'],
  [/spotify/i, 'bg-[#1db954] text-black'],
  [/paramount/i, 'bg-[#0064ff] text-white'],
  [/crunchyroll/i, 'bg-[#f47521] text-white'],
  [/star/i, 'bg-[#1f2a44] text-white'],
  [/apple/i, 'bg-[#e5e7eb] text-black'],
  [/canva/i, 'bg-[#00c4cc] text-white'],
  [/vix/i, 'bg-[#ff5b00] text-white'],
  [/movistar/i, 'bg-[#019df4] text-white'],
  [/directv/i, 'bg-[#00a3e0] text-white'],
  [/iptv|tv/i, 'bg-[#7c3aed] text-white'],
];

export function IconoServicio({ nombre, imagenUrl, tamano = 'sm' }) {
  const medida = tamano === 'md' ? 'h-8 w-8 text-xs' : 'h-6 w-6 text-[11px]';
  if (imagenUrl) {
    return <img src={urlArchivo(imagenUrl)} alt="" className={`${medida} shrink-0 rounded-md object-cover ring-1 ring-white/10`} />;
  }
  const color = COLOR_MARCA.find(([re]) => re.test(nombre || ''))?.[1] || 'bg-superficie-alta text-texto-suave';
  return (
    <span className={`grid shrink-0 place-items-center rounded-md font-bold ${medida} ${color}`} aria-hidden="true">
      {nombre?.[0]?.toUpperCase() || '?'}
    </span>
  );
}

/**
 * Selector de opciones en fila (pestañas). `ancho` = ocupa todo el ancho
 * con segmentos iguales (pestañas de Ganancias, como en la referencia).
 */
export function Segmentos({ opciones, valor, onCambio, etiqueta, ancho = false }) {
  return (
    <div
      role="tablist"
      aria-label={etiqueta}
      className={`${ancho ? 'grid w-full' : 'inline-flex'} rounded-xl border border-white/[0.07] bg-black/40 p-1`}
      style={ancho ? { gridTemplateColumns: `repeat(${opciones.length}, minmax(0, 1fr))` } : undefined}
    >
      {opciones.map((o) => (
        <button
          key={o.valor}
          role="tab"
          aria-selected={valor === o.valor}
          onClick={() => onCambio(o.valor)}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            valor === o.valor
              ? 'bg-gradient-to-b from-marca-400 to-marca-600 text-fondo shadow-md shadow-marca-500/25'
              : 'text-texto-suave hover:bg-white/[0.04] hover:text-texto'
          }`}
        >
          {o.texto}
        </button>
      ))}
    </div>
  );
}
