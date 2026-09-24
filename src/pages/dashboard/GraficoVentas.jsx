/**
 * pages/dashboard/GraficoVentas.jsx  (Dashboard 2026-09-24)
 * -----------------------------------------
 * GET /admin/dashboard/ventas-serie?rango=7d|30d|12m
 * Columnas en SVG propio (sin librería nueva). UN solo eje: se elige la
 * medida (Ventas en S/ o cantidad de pagos) en vez de mezclar dos escalas
 * en el mismo gráfico. Tooltip por columna con ambos valores y una vista
 * de tabla para leer los números exactos.
 */
import { useEffect, useRef, useState } from 'react';
import { useApi } from '../../hooks/useApi';
import * as dashboardApi from '../../api/dashboard';
import { Tarjeta, EstadoCarga, EstadoError } from '../../components/ui';
import { capitalizar, fechaCalendario, moneda, numero } from '../../utils/formato';
import { Segmentos } from './piezas.jsx';

const RANGOS = [
  { valor: '7d', texto: '7 días' },
  { valor: '30d', texto: '30 días' },
  { valor: '12m', texto: 'Mensual' },
];
const MEDIDAS = [
  { valor: 'ventas', texto: 'Ventas (S/)' },
  { valor: 'pedidos', texto: 'Pagos' },
];

const ALTO = 220;
const MARGEN = { arriba: 12, derecha: 8, abajo: 26, izquierda: 56 };
const ANCHO_MAX_COLUMNA = 24;
const COLOR_COLUMNA = 'var(--color-marca-500)';

/** Paso "redondo" (1, 2, 5 × 10^n) para que los ticks del eje sean números limpios. */
function pasoLimpio(maximo, divisiones = 4) {
  if (maximo <= 0) return 1;
  const bruto = maximo / divisiones;
  const potencia = 10 ** Math.floor(Math.log10(bruto));
  const base = [1, 2, 5, 10].find((b) => b * potencia >= bruto);
  return base * potencia;
}

function etiquetaPunto(fecha, unidad, larga = false) {
  if (unidad === 'mes') return capitalizar(fechaCalendario(fecha, larga ? { month: 'long', year: 'numeric' } : { month: 'short' }));
  return capitalizar(fechaCalendario(fecha, larga ? { weekday: 'short', day: '2-digit', month: 'short' } : { day: '2-digit', month: '2-digit' }));
}

export function GraficoVentas({ recargar }) {
  const [rango, setRango] = useState('30d');
  const [medida, setMedida] = useState('ventas');
  const { data, cargando, error, refetch } = useApi(() => dashboardApi.ventasSerie(rango), [rango, recargar]);

  const puntos = data?.rango === rango ? data.puntos : [];
  const totalVentas = puntos.reduce((s, p) => s + p.ventas, 0);
  const totalPagos = puntos.reduce((s, p) => s + p.pedidos, 0);

  return (
    <Tarjeta
      titulo="Ventas por periodo"
      acciones={<Segmentos etiqueta="Rango del gráfico" opciones={RANGOS} valor={rango} onCambio={setRango} />}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-texto-suave">
          Total: <span className="font-semibold text-texto">{moneda(totalVentas)}</span> ·{' '}
          <span className="font-semibold text-texto">{numero(totalPagos)}</span> pago{totalPagos === 1 ? '' : 's'}
        </p>
        <Segmentos etiqueta="Medida del gráfico" opciones={MEDIDAS} valor={medida} onCambio={setMedida} />
      </div>

      {error ? (
        <EstadoError error={error} onReintentar={refetch} />
      ) : cargando && !puntos.length ? (
        <EstadoCarga />
      ) : (
        <>
          <Columnas puntos={puntos} unidad={data?.unidad} medida={medida} />
          <details className="mt-2 text-xs text-texto-suave">
            <summary className="cursor-pointer select-none hover:text-texto">Ver como tabla</summary>
            <div className="mt-2 max-h-56 overflow-y-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-borde">
                    <th className="py-1 font-medium">{data?.unidad === 'mes' ? 'Mes' : 'Día'}</th>
                    <th className="py-1 text-right font-medium">Ventas</th>
                    <th className="py-1 text-right font-medium">Pagos</th>
                  </tr>
                </thead>
                <tbody>
                  {puntos.map((p) => (
                    <tr key={p.fecha} className="border-b border-borde/50 text-texto">
                      <td className="py-1">{etiquetaPunto(p.fecha, data.unidad, true)}</td>
                      <td className="py-1 text-right">{moneda(p.ventas)}</td>
                      <td className="py-1 text-right">{numero(p.pedidos)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}
    </Tarjeta>
  );
}

function Columnas({ puntos, unidad, medida }) {
  const contenedor = useRef(null);
  const [ancho, setAncho] = useState(600);
  const [activo, setActivo] = useState(null);

  useEffect(() => {
    const el = contenedor.current;
    if (!el) return undefined;
    const observador = new ResizeObserver(([entrada]) => setAncho(Math.max(240, entrada.contentRect.width)));
    observador.observe(el);
    return () => observador.disconnect();
  }, []);

  const valores = puntos.map((p) => p[medida]);
  const maximo = Math.max(0, ...valores);
  const paso = medida === 'pedidos' ? Math.max(1, pasoLimpio(maximo)) : pasoLimpio(maximo); // pagos: enteros
  const tope = Math.max(paso, Math.ceil(maximo / paso) * paso);
  const ticks = [];
  for (let t = 0; t <= tope + 1e-9; t += paso) ticks.push(t);

  const anchoPlot = ancho - MARGEN.izquierda - MARGEN.derecha;
  const altoPlot = ALTO - MARGEN.arriba - MARGEN.abajo;
  const banda = puntos.length ? anchoPlot / puntos.length : anchoPlot;
  const anchoColumna = Math.max(2, Math.min(ANCHO_MAX_COLUMNA, banda - 2)); // 2px de aire entre columnas
  const y = (v) => MARGEN.arriba + altoPlot - (v / tope) * altoPlot;
  const cadaCuanto = Math.ceil(puntos.length / Math.max(2, Math.floor(anchoPlot / 56))); // rótulos sin encimarse
  const formatear = (v) => (medida === 'ventas' ? moneda(v) : numero(v));

  const p = activo !== null ? puntos[activo] : null;
  const xActivo = activo !== null ? MARGEN.izquierda + banda * activo + banda / 2 : 0;

  return (
    <div ref={contenedor} className="relative w-full" onMouseLeave={() => setActivo(null)}>
      <svg width={ancho} height={ALTO} role="img" aria-label={`Gráfico de ${medida === 'ventas' ? 'ventas' : 'pagos'} por periodo`}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={MARGEN.izquierda} x2={ancho - MARGEN.derecha} y1={y(t)} y2={y(t)} stroke="var(--color-borde)" strokeWidth="1" />
            <text x={MARGEN.izquierda - 6} y={y(t)} dy="0.32em" textAnchor="end" fontSize="10" fill="var(--color-texto-suave)">
              {medida === 'ventas' ? `S/ ${numero(t)}` : numero(t)}
            </text>
          </g>
        ))}

        {puntos.map((pt, i) => {
          const v = pt[medida];
          const x = MARGEN.izquierda + banda * i + (banda - anchoColumna) / 2;
          const alto = (v / tope) * altoPlot;
          const r = Math.min(4, anchoColumna / 2, alto);
          const base = MARGEN.arriba + altoPlot;
          const tope_ = base - alto;
          return (
            <g key={pt.fecha}>
              {v > 0 && (
                // Extremo superior redondeado (4px), base recta sobre el eje.
                <path
                  d={`M${x},${base} V${tope_ + r} Q${x},${tope_} ${x + r},${tope_} H${x + anchoColumna - r} Q${x + anchoColumna},${tope_} ${x + anchoColumna},${tope_ + r} V${base} Z`}
                  fill={COLOR_COLUMNA}
                  opacity={activo === null || activo === i ? 1 : 0.45}
                />
              )}
              {/* Zona de hover: toda la banda, más grande que la columna. */}
              <rect
                x={MARGEN.izquierda + banda * i}
                y={MARGEN.arriba}
                width={banda}
                height={altoPlot}
                fill="transparent"
                onMouseEnter={() => setActivo(i)}
              />
              {i % cadaCuanto === 0 && (
                <text x={MARGEN.izquierda + banda * i + banda / 2} y={ALTO - 8} textAnchor="middle" fontSize="10" fill="var(--color-texto-suave)">
                  {etiquetaPunto(pt.fecha, unidad)}
                </text>
              )}
            </g>
          );
        })}
        <line
          x1={MARGEN.izquierda}
          x2={ancho - MARGEN.derecha}
          y1={MARGEN.arriba + altoPlot}
          y2={MARGEN.arriba + altoPlot}
          stroke="var(--color-texto-suave)"
          strokeOpacity="0.4"
          strokeWidth="1"
        />
      </svg>

      {maximo === 0 && (
        <p className="pointer-events-none absolute inset-x-0 top-1/3 text-center text-sm text-texto-suave">
          Sin ventas registradas en este periodo.
        </p>
      )}

      {p && (
        <div
          className="pointer-events-none absolute top-0 z-10 rounded-lg border border-borde bg-superficie-alta px-3 py-2 text-xs shadow-lg"
          style={{ left: Math.min(Math.max(xActivo - 70, 0), ancho - 150), width: 150 }}
        >
          <p className="mb-1 font-semibold text-texto">{etiquetaPunto(p.fecha, unidad, true)}</p>
          <p className="flex justify-between text-texto-suave">
            Ventas <span className="font-semibold text-texto">{moneda(p.ventas)}</span>
          </p>
          <p className="flex justify-between text-texto-suave">
            Pagos <span className="font-semibold text-texto">{numero(p.pedidos)}</span>
          </p>
        </div>
      )}
      <span className="sr-only">Máximo del periodo: {formatear(maximo)}</span>
    </div>
  );
}
