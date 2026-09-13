/**
 * pages/dashboard/PanelMasVendidos.jsx  (Fase 2)
 * -----------------------------------------
 * GET /admin/dashboard/servicios-mas-vendidos?limite=10  (límite fijo).
 * Ranking por pedidos pagados. Filas: { id, nombre, categoria,
 * cantidad_vendida, ingresos_generados }.
 *
 * Gráfico de barras con los datos reales (altura proporcional a
 * cantidad_vendida) -- sin librería nueva, solo CSS. Debajo de cada
 * barra se muestra el ingreso generado, con datos reales del backend.
 */
import { useApi } from '../../hooks/useApi';
import * as dashboardApi from '../../api/dashboard';
import { Tarjeta, EstadoCarga, EstadoError, EstadoVacio } from '../../components/ui';
import { moneda, numero } from '../../utils/formato';

const LIMITE = 6;

export function PanelMasVendidos({ recargar }) {
  const { data, cargando, error, refetch } = useApi(
    () => dashboardApi.serviciosMasVendidos(LIMITE),
    [recargar]
  );
  const filas = Array.isArray(data) ? data : [];
  const maximo = Math.max(1, ...filas.map((f) => Number(f.cantidad_vendida) || 0));

  return (
    <Tarjeta titulo={`Servicios más vendidos (top ${LIMITE})`}>
      {error ? (
        <EstadoError error={error} onReintentar={refetch} />
      ) : cargando && !data ? (
        <EstadoCarga />
      ) : filas.length === 0 ? (
        <EstadoVacio titulo="Sin datos" descripcion="Todavía no hay pedidos pagados." />
      ) : (
        <div className="flex h-52 items-end justify-between gap-3 px-1">
          {filas.map((f) => {
            const alturaPct = Math.max(6, (Number(f.cantidad_vendida) / maximo) * 100);
            return (
              <div key={f.id} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                <span className="text-xs font-semibold text-texto">{numero(f.cantidad_vendida)}</span>
                <div
                  className="w-full max-w-10 rounded-t-lg bg-gradient-to-t from-marca-700 to-marca-400 shadow-[0_0_14px_-4px_rgba(212,175,55,0.5)]"
                  style={{ height: `${alturaPct}%` }}
                  title={`${f.nombre}: ${numero(f.cantidad_vendida)} vendidos · ${moneda(f.ingresos_generados)}`}
                />
                <p className="w-full truncate text-center text-[11px] text-texto-suave" title={f.nombre}>
                  {f.nombre}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </Tarjeta>
  );
}
