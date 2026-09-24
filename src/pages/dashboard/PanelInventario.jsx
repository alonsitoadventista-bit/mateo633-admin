/**
 * pages/dashboard/PanelInventario.jsx  (Dashboard 2026-09-24)
 * -----------------------------------------
 * GET /admin/dashboard/inventario -> estado por servicio:
 *   Disponibles  = perfiles libres para asignar (mismo criterio que la asignación automática);
 *   Por vencer   = perfiles asignados cuyo servicio vence en 7 días o menos;
 *   Agotadas     = cuentas sin ningún perfil disponible;
 *   Por rotar    = perfiles vencidos que esperan cambio de contraseña + "Liberar";
 *   Total        = perfiles de cuentas vigentes.
 * Se listan los servicios con inventario o con ventas en 30 días; el resto se resume abajo.
 */
import { Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import * as dashboardApi from '../../api/dashboard';
import { Tarjeta, Etiqueta, EstadoCarga, EstadoError, EstadoVacio } from '../../components/ui';
import { numero } from '../../utils/formato';
import { IconoServicio } from './piezas.jsx';

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
    <Tarjeta
      titulo="Estado del inventario"
      acciones={
        <Link to="/inventario" className="text-xs font-medium text-marca-500 hover:underline">
          Ver inventario →
        </Link>
      }
    >
      {error ? (
        <EstadoError error={error} onReintentar={refetch} />
      ) : cargando && !data ? (
        <EstadoCarga />
      ) : visibles.length === 0 ? (
        <EstadoVacio titulo="Sin inventario" descripcion="Todavía no hay cuentas cargadas en el inventario." />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-borde text-left text-xs uppercase tracking-wide text-texto-suave">
                  <th className="whitespace-nowrap px-2 py-2 font-medium">Servicio</th>
                  <th className="whitespace-nowrap px-2 py-2 text-right font-medium" title="Perfiles libres para asignar">Disp.</th>
                  <th className="whitespace-nowrap px-2 py-2 text-right font-medium" title="Perfiles asignados cuyo servicio vence en 7 días o menos">Vencen 7 d</th>
                  <th className="whitespace-nowrap px-2 py-2 text-right font-medium" title="Cuentas sin ningún perfil disponible / cuentas totales">Agotadas</th>
                  <th className="whitespace-nowrap px-2 py-2 text-right font-medium" title="Perfiles vencidos: cambiar contraseña y Liberar">Por rotar</th>
                  <th className="whitespace-nowrap px-2 py-2 text-right font-medium" title="Perfiles de cuentas vigentes">Total</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((f) => (
                  <tr key={f.id} className="border-b border-borde">
                    <td className="px-2 py-2">
                      <span className="flex items-center gap-2">
                        <IconoServicio nombre={f.nombre} imagenUrl={f.imagen_url} />
                        <span className="flex flex-col items-start gap-0.5">
                          <span className="whitespace-nowrap text-texto">{f.nombre}</span>
                          {f.stock_bajo && (
                            <Etiqueta color={f.disponibles === 0 ? 'red' : 'amber'} className="whitespace-nowrap">
                              {f.disponibles === 0 ? 'sin stock' : 'stock bajo'}
                            </Etiqueta>
                          )}
                        </span>
                      </span>
                    </td>
                    <td className="px-2 py-2 text-right font-semibold text-green-400">{numero(f.disponibles)}</td>
                    <td className="px-2 py-2 text-right text-amber-400">{numero(f.por_vencer)}</td>
                    <td className="px-2 py-2 text-right text-red-400" title={`${f.cuentas_agotadas} de ${f.cuentas_total} cuentas sin perfiles libres`}>
                      {numero(f.cuentas_agotadas)}
                      <span className="text-texto-suave">/{numero(f.cuentas_total)}</span>
                    </td>
                    <td className="px-2 py-2 text-right text-texto">{numero(f.por_rotar)}</td>
                    <td className="px-2 py-2 text-right text-texto">{numero(f.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-texto-suave">
            {numero(totales.disponibles)} disponibles · {numero(totales.por_vencer)} por vencer · {numero(totales.total)} perfiles en total
            {sinInventario > 0 && ` · ${sinInventario} servicio${sinInventario === 1 ? '' : 's'} activo${sinInventario === 1 ? '' : 's'} sin inventario ni ventas recientes`}
          </p>
        </>
      )}
    </Tarjeta>
  );
}
