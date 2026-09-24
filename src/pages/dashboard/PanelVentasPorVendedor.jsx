/**
 * pages/dashboard/PanelVentasPorVendedor.jsx  (Fase 2; estilo del Dashboard 2026-09-24)
 * -----------------------------------------
 * GET /admin/dashboard/ventas-por-vendedor
 * Filas: { vendedor_id, vendedor_nombre, rol, cantidad_pagos, monto_total }.
 *
 * DECISIÓN DE NEGOCIO: solo para el rol 'administrador'. DashboardPage no
 * lo monta para un vendedor y, desde 2026-09-24, el backend también
 * responde 403 (requiereRol('administrador')).
 */
import { useApi } from '../../hooks/useApi';
import * as dashboardApi from '../../api/dashboard';
import { EstadoCarga, EstadoError, EstadoVacio } from '../../components/ui';
import { moneda, numero, humanizar } from '../../utils/formato';
import { PanelDash } from './piezas.jsx';

export function PanelVentasPorVendedor({ recargar }) {
  const { data, cargando, error, refetch } = useApi(() => dashboardApi.ventasPorVendedor(), [recargar]);
  const filas = Array.isArray(data) ? data : [];

  return (
    <PanelDash icono="usuarios" tono="dorado" titulo="Ventas por vendedor" subtitulo="Pagos registrados por cada usuario del panel">
      {error ? (
        <EstadoError error={error} onReintentar={refetch} />
      ) : cargando && !data ? (
        <EstadoCarga />
      ) : filas.length === 0 ? (
        <EstadoVacio titulo="Sin datos" descripcion="Aún no hay pagos registrados por ningún usuario." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-white/[0.03] text-left text-[11px] uppercase tracking-wider text-texto-suave">
                <th className="px-3 py-2.5 font-semibold">Usuario</th>
                <th className="px-3 py-2.5 font-semibold">Rol</th>
                <th className="px-3 py-2.5 text-right font-semibold">Pagos</th>
                <th className="px-3 py-2.5 text-right font-semibold">Monto total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {filas.map((f) => (
                <tr key={f.vendedor_id} className="transition hover:bg-white/[0.03]">
                  <td className="px-3 py-2.5">
                    <span className="flex items-center gap-2.5">
                      <span className="grid h-7 w-7 place-items-center rounded-full bg-marca-500/15 text-xs font-bold text-marca-400 ring-1 ring-marca-500/30">
                        {f.vendedor_nombre?.[0]?.toUpperCase() || '?'}
                      </span>
                      <span className="font-medium text-texto">{f.vendedor_nombre}</span>
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-semibold text-texto-suave">
                      {humanizar(f.rol)}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-texto">{numero(f.cantidad_pagos)}</td>
                  <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-texto">{moneda(f.monto_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PanelDash>
  );
}
