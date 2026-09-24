/**
 * pages/dashboard/PanelGanancias.jsx  (Dashboard 2026-09-24)
 * -----------------------------------------
 * GET /admin/dashboard/ganancias -- SOLO administrador (el backend responde
 * 403 a un vendedor; DashboardPage ni siquiera monta este panel para él).
 *
 * Decisión del usuario (opción A): ganancia neta = ventas (pagos cobrados)
 * - costos (compras de cuentas al proveedor con fecha_inicio en el periodo).
 * Pestañas: diaria, semanal (desde el lunes), mensual y anual, cada una
 * comparada con el periodo anterior completo.
 */
import { useState } from 'react';
import { useApi } from '../../hooks/useApi';
import * as dashboardApi from '../../api/dashboard';
import { EstadoCarga, EstadoError } from '../../components/ui';
import { IconoNav } from '../../components/IconoNav.jsx';
import { capitalizar, fechaCalendario, moneda, numero, variacionPct } from '../../utils/formato';
import { PanelDash, Segmentos } from './piezas.jsx';

const PERIODOS = [
  { valor: 'dia', texto: 'Diaria', corto: 'Hoy', titulo: 'Ganancia del día', anterior: 'vs. ayer' },
  { valor: 'semana', texto: 'Semanal', corto: 'Esta semana', titulo: 'Ganancia de la semana', anterior: 'vs. semana anterior' },
  { valor: 'mes', texto: 'Mensual', corto: 'Este mes', titulo: 'Ganancia del mes', anterior: 'vs. mes anterior' },
  { valor: 'anio', texto: 'Anual', corto: 'Este año', titulo: 'Ganancia del año', anterior: 'vs. año anterior' },
];

/** Tinte de cada mini tarjeta de periodo (como la referencia: turquesa, violeta, dorado). */
const TINTE_MINI = [
  'border-teal-500/25 from-teal-500/15 text-teal-300',
  'border-violet-500/25 from-violet-500/15 text-violet-300',
  'border-marca-500/30 from-marca-500/15 text-marca-400',
];

function rango(p, clave) {
  if (clave === 'dia') return capitalizar(fechaCalendario(p.desde, { weekday: 'long', day: '2-digit', month: 'long' }));
  if (clave === 'anio') return fechaCalendario(p.desde, { year: 'numeric' });
  return `${fechaCalendario(p.desde)} – ${fechaCalendario(p.hasta)}`;
}

/** Recuadro de variación a la derecha del monto (↑ verde / ↓ rojo / sin base). */
function Variacion({ valor, contexto, anterior }) {
  const texto = variacionPct(valor);
  if (texto === null) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-center">
        <p className="text-xs text-texto-suave">{contexto}</p>
        <p className="text-sm font-semibold text-texto">{moneda(anterior)}</p>
      </div>
    );
  }
  const sube = Number(valor) >= 0;
  return (
    <div
      className={`rounded-xl border px-4 py-2 text-center ${
        sube ? 'border-green-500/30 bg-green-500/10 text-green-400' : 'border-red-500/30 bg-red-500/10 text-red-400'
      }`}
    >
      <p className="text-xl font-bold">
        {sube ? '↑' : '↓'} {texto}
      </p>
      <p className="text-xs text-texto-suave">{contexto}</p>
    </div>
  );
}

export function PanelGanancias({ recargar }) {
  const { data, cargando, error, refetch } = useApi(() => dashboardApi.ganancias(), [recargar]);
  const [periodo, setPeriodo] = useState('dia');

  const def = PERIODOS.find((p) => p.valor === periodo);
  const p = data?.periodos?.[periodo];

  return (
    <PanelDash icono="billetera" tono="violeta" titulo="Ganancias" subtitulo="Resumen de ingresos netos (descontando costos)">
      {error ? (
        <EstadoError error={error} onReintentar={refetch} />
      ) : cargando && !data ? (
        <EstadoCarga />
      ) : !p ? null : (
        <div className="space-y-4">
          <Segmentos etiqueta="Periodo de ganancias" opciones={PERIODOS} valor={periodo} onCambio={setPeriodo} ancho />

          <div className="rounded-2xl border border-white/[0.06] bg-black/30 p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm text-texto-suave">
                  {def.titulo} · {rango(p, periodo)}
                </p>
                <p className={`mt-1 text-4xl font-bold tracking-tight tabular-nums ${p.ganancia < 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {moneda(p.ganancia)}
                </p>
              </div>
              <Variacion valor={p.variacion_ganancia_pct} contexto={def.anterior} anterior={p.anterior.ganancia} />
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-white/[0.06] pt-3 text-sm sm:grid-cols-4">
              <div>
                <dt className="text-xs text-texto-suave">Ventas totales</dt>
                <dd className="font-semibold tabular-nums text-texto">{moneda(p.ventas)}</dd>
              </div>
              <div>
                <dt className="text-xs text-texto-suave">Costos (proveedor)</dt>
                <dd className="font-semibold tabular-nums text-rose-300">− {moneda(p.costos)}</dd>
              </div>
              <div>
                <dt className="text-xs text-texto-suave">Ganancia neta</dt>
                <dd className="font-semibold tabular-nums text-texto">{moneda(p.ganancia)}</dd>
              </div>
              <div>
                <dt className="text-xs text-texto-suave">Pedidos pagados</dt>
                <dd className="font-semibold tabular-nums text-texto">{numero(p.pedidos)}</dd>
              </div>
            </dl>
          </div>

          {/* Los otros 3 periodos, para compararlos de un vistazo (clic = abrir esa pestaña). */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {PERIODOS.filter((o) => o.valor !== periodo).map((o, i) => {
              const otro = data.periodos[o.valor];
              return (
                <button
                  key={o.valor}
                  onClick={() => setPeriodo(o.valor)}
                  className={`flex items-center gap-3 rounded-xl border bg-gradient-to-br to-transparent px-3 py-2.5 text-left transition hover:brightness-125 ${TINTE_MINI[i]}`}
                >
                  <IconoNav nombre="calendario" className="h-6 w-6 shrink-0" />
                  <span className="min-w-0">
                    <span className="block text-xs text-texto/80">{o.corto}</span>
                    <span className="block text-sm font-bold tabular-nums text-texto">{moneda(otro.ganancia)}</span>
                    <span className="block text-[11px] text-texto-suave">{numero(otro.pedidos)} pedidos</span>
                  </span>
                </button>
              );
            })}
          </div>

          {(p.cuentas_sin_costo > 0 || data.cuentas_con_costo_sin_fecha > 0) && (
            <div className="flex gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
              <IconoNav nombre="alerta" className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
              <div className="space-y-0.5">
                {p.cuentas_sin_costo > 0 && (
                  <p>
                    {numero(p.cuentas_sin_costo)} cuenta{p.cuentas_sin_costo === 1 ? '' : 's'} comprada
                    {p.cuentas_sin_costo === 1 ? '' : 's'} en este periodo sin costo cargado: no se descuenta
                    {p.cuentas_sin_costo === 1 ? '' : 'n'}.
                  </p>
                )}
                {data.cuentas_con_costo_sin_fecha > 0 && (
                  <p>
                    {numero(data.cuentas_con_costo_sin_fecha)} cuenta{data.cuentas_con_costo_sin_fecha === 1 ? '' : 's'} con
                    costo pero sin fecha de inicio: no entra{data.cuentas_con_costo_sin_fecha === 1 ? '' : 'n'} en ningún periodo.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </PanelDash>
  );
}
