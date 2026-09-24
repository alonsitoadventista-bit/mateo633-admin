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
import { Tarjeta, EstadoCarga, EstadoError } from '../../components/ui';
import { capitalizar, fechaCalendario, moneda, numero } from '../../utils/formato';
import { FilaDato, Indicador, Segmentos } from './piezas.jsx';

const PERIODOS = [
  { valor: 'dia', texto: 'Diaria', corto: 'Hoy', titulo: 'Ganancia del día', anterior: 'vs. ayer' },
  { valor: 'semana', texto: 'Semanal', corto: 'Esta semana', titulo: 'Ganancia de la semana', anterior: 'vs. semana anterior' },
  { valor: 'mes', texto: 'Mensual', corto: 'Este mes', titulo: 'Ganancia del mes', anterior: 'vs. mes anterior' },
  { valor: 'anio', texto: 'Anual', corto: 'Este año', titulo: 'Ganancia del año', anterior: 'vs. año anterior' },
];

function rango(p, clave) {
  if (clave === 'dia') return capitalizar(fechaCalendario(p.desde, { weekday: 'long', day: '2-digit', month: 'long' }));
  if (clave === 'anio') return fechaCalendario(p.desde, { year: 'numeric' });
  return `${fechaCalendario(p.desde)} – ${fechaCalendario(p.hasta)}`;
}

export function PanelGanancias({ recargar }) {
  const { data, cargando, error, refetch } = useApi(() => dashboardApi.ganancias(), [recargar]);
  const [periodo, setPeriodo] = useState('dia');

  const def = PERIODOS.find((p) => p.valor === periodo);
  const p = data?.periodos?.[periodo];

  return (
    <Tarjeta
      titulo="Ganancias"
      acciones={<Segmentos etiqueta="Periodo de ganancias" opciones={PERIODOS} valor={periodo} onCambio={setPeriodo} />}
    >
      {error ? (
        <EstadoError error={error} onReintentar={refetch} />
      ) : cargando && !data ? (
        <EstadoCarga />
      ) : !p ? null : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm text-texto-suave">
                {def.titulo} · {rango(p, periodo)}
              </p>
              <p className={`text-3xl font-bold ${p.ganancia < 0 ? 'text-red-400' : 'text-green-400'}`}>{moneda(p.ganancia)}</p>
              <Indicador valor={p.variacion_ganancia_pct} contexto={def.anterior} sinBase={`${def.anterior}: ${moneda(p.anterior.ganancia)}`} />
            </div>
          </div>

          <div className="space-y-1.5 border-t border-borde pt-3">
            <FilaDato etiqueta="Ventas totales" valor={moneda(p.ventas)} />
            <FilaDato etiqueta="Costos (compras al proveedor)" valor={`− ${moneda(p.costos)}`} />
            <FilaDato etiqueta="Ganancia neta" valor={moneda(p.ganancia)} />
            <FilaDato etiqueta="Pedidos pagados" valor={numero(p.pedidos)} />
          </div>

          {/* Resumen de los otros periodos, para compararlos de un vistazo. */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {PERIODOS.filter((o) => o.valor !== periodo).map((o) => {
              const otro = data.periodos[o.valor];
              return (
                <button
                  key={o.valor}
                  onClick={() => setPeriodo(o.valor)}
                  className="rounded-xl border border-borde bg-fondo px-3 py-2 text-left transition hover:border-marca-500/40"
                >
                  <p className="text-xs text-texto-suave">{o.corto}</p>
                  <p className="text-sm font-semibold text-texto">{moneda(otro.ganancia)}</p>
                  <p className="text-[11px] text-texto-suave">{numero(otro.pedidos)} pedidos</p>
                </button>
              );
            })}
          </div>

          {(p.cuentas_sin_costo > 0 || data.cuentas_con_costo_sin_fecha > 0) && (
            <div className="space-y-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
              {p.cuentas_sin_costo > 0 && (
                <p>
                  ⚠ {numero(p.cuentas_sin_costo)} cuenta{p.cuentas_sin_costo === 1 ? '' : 's'} comprada
                  {p.cuentas_sin_costo === 1 ? '' : 's'} en este periodo sin costo cargado: no se descuenta
                  {p.cuentas_sin_costo === 1 ? '' : 'n'}.
                </p>
              )}
              {data.cuentas_con_costo_sin_fecha > 0 && (
                <p>
                  ⚠ {numero(data.cuentas_con_costo_sin_fecha)} cuenta{data.cuentas_con_costo_sin_fecha === 1 ? '' : 's'} con costo
                  pero sin fecha de inicio: no entra{data.cuentas_con_costo_sin_fecha === 1 ? '' : 'n'} en ningún periodo.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </Tarjeta>
  );
}
