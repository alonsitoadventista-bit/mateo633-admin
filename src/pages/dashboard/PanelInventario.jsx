/**
 * pages/dashboard/PanelInventario.jsx  (Dashboard 2026-09-24)
 * -----------------------------------------
 * GET /admin/dashboard/inventario -> estado por servicio:
 *   Disponibles  = perfiles libres para asignar (mismo criterio que la asignación automática);
 *   Vencen 7 d   = perfiles asignados cuyo servicio vence en 7 días o menos;
 *   Agotadas     = cuentas sin ningún perfil disponible (sobre el total de cuentas);
 *   Por rotar    = perfiles vencidos que esperan cambio de contraseña + "Liberar";
 *   Total        = perfiles de cuentas vigentes.
 * Se listan los servicios con inventario o con ventas en 30 días; el resto se resume abajo.
 */
import { useApi } from '../../hooks/useApi';
import * as dashboardApi from '../../api/dashboard';
import { EstadoCarga, EstadoError, EstadoVacio } from '../../components/ui';
import { numero } from '../../utils/formato';
import { EnlacePill, IconoServicio, PanelDash } from './piezas.jsx';

const COLUMNAS = [
  { clave: 'disponibles', titulo: 'Disp.', ayuda: 'Perfiles libres para asignar' },
  { clave: 'por_vencer', titulo: 'Vencen 7 d', ayuda: 'Perfiles asignados cuyo servicio vence en 7 días o menos' },
  { clave: 'agotadas', titulo: 'Agotadas', ayuda: 'Cuentas sin ningún perfil disponible / cuentas totales' },
  { clave: 'por_rotar', titulo: 'Por rotar', ayuda: 'Perfiles vencidos: cambiar contraseña y Liberar' },
  { clave: 'total', titulo: 'Total', ayuda: 'Perfiles de cuentas vigentes' },
];

export function PanelInventario({ recargar }) {
  const { data, cargando, error, refetch } = useApi(() => dashboardApi.inventario(), [recargar]);
  const filas = Array.isArray(data) ? data : [];
  const visibles = filas.filter((f) => f.total > 0 || f.ventas_30d > 0);
  const sinInventario = filas.length - visibles.length;
  const totales = visibles.reduce(
    (t, f) => ({ disponibles: t.disponibles + f.disponibles, por_vencer: t.por_vencer + f.por_vencer, total: t.total + f.total }),
    { disponibles: 0, por_vencer: 0, total: 0 }
  );

  return (
    <PanelDash
      icono="basedatos"
      tono="azul"
      titulo="Estado del inventario de cuentas"
      subtitulo="Perfiles por servicio"
      acciones={<EnlacePill to="/inventario">Ver inventario</EnlacePill>}
    >
      {error ? (
        <EstadoError error={error} onReintentar={refetch} />
      ) : cargando && !data ? (
        <EstadoCarga />
      ) : visibles.length === 0 ? (
        <EstadoVacio titulo="Sin inventario" descripcion="Todavía no hay cuentas cargadas en el inventario." />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-white/[0.03] text-left text-[11px] uppercase tracking-wider text-texto-suave">
                  <th className="whitespace-nowrap px-3 py-2.5 font-semibold">Servicio</th>
                  {COLUMNAS.map((c) => (
                    <th key={c.clave} className="whitespace-nowrap px-3 py-2.5 text-right font-semibold" title={c.ayuda}>
                      {c.titulo}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {visibles.map((f) => (
                  <tr key={f.id} className="transition hover:bg-white/[0.03]">
                    <td className="px-3 py-2.5">
                      <span className="flex items-center gap-2.5">
                        <IconoServicio nombre={f.nombre} imagenUrl={f.imagen_url} />
                        <span className="flex flex-col items-start">
                          <span className="whitespace-nowrap font-medium text-texto">{f.nombre}</span>
                          {f.stock_bajo && (
                            <span
                              className={`whitespace-nowrap text-[10px] font-semibold uppercase tracking-wide ${
                                f.disponibles === 0 ? 'text-rose-400' : 'text-amber-400'
                              }`}
                            >
                              ● {f.disponibles === 0 ? 'Sin stock' : 'Stock bajo'}
                            </span>
                          )}
                        </span>
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right font-bold tabular-nums text-emerald-400">{numero(f.disponibles)}</td>
                    <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-amber-400">{numero(f.por_vencer)}</td>
                    <td
                      className="px-3 py-2.5 text-right font-semibold tabular-nums text-rose-400"
                      title={`${f.cuentas_agotadas} de ${f.cuentas_total} cuentas sin perfiles libres`}
                    >
                      {numero(f.cuentas_agotadas)}
                      <span className="font-normal text-texto-suave">/{numero(f.cuentas_total)}</span>
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-texto/85">{numero(f.por_rotar)}</td>
                    <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-texto">{numero(f.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-texto-suave">
            <span className="font-semibold text-emerald-400">{numero(totales.disponibles)}</span> disponibles ·{' '}
            <span className="font-semibold text-amber-400">{numero(totales.por_vencer)}</span> por vencer ·{' '}
            <span className="font-semibold text-texto">{numero(totales.total)}</span> perfiles en total
            {sinInventario > 0 &&
              ` · ${sinInventario} servicio${sinInventario === 1 ? '' : 's'} activo${sinInventario === 1 ? '' : 's'} sin inventario ni ventas recientes`}
          </p>
        </>
      )}
    </PanelDash>
  );
}
