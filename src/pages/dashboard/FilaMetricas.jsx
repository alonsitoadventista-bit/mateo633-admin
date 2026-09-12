/**
 * pages/dashboard/FilaMetricas.jsx  (Fase 2)
 * -----------------------------------------
 * GET /admin/dashboard/metricas
 * Respuesta: { clientes_totales, clientes_activos,
 *   ventas: { hoy:{monto,cantidad}, semana:{monto}, mes:{monto,cantidad}, anio:{monto} },
 *   ingresos_totales, pedidos_pendientes_de_pago }
 */
import { useApi } from '../../hooks/useApi';
import * as dashboardApi from '../../api/dashboard';
import { TarjetaMetrica, EstadoCarga, EstadoError } from '../../components/ui';
import { moneda, numero } from '../../utils/formato';

export function FilaMetricas({ recargar }) {
  const { data, cargando, error, refetch } = useApi(() => dashboardApi.metricas(), [recargar]);

  if (error) return <EstadoError error={error} onReintentar={refetch} />;
  if (cargando && !data) return <EstadoCarga texto="Cargando métricas…" />;
  if (!data) return null;

  const v = data.ventas || {};

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <TarjetaMetrica
        etiqueta="Clientes"
        valor={numero(data.clientes_totales)}
        pie={`${numero(data.clientes_activos)} activos`}
      />
      <TarjetaMetrica
        etiqueta="Ventas hoy"
        valor={moneda(v.hoy?.monto)}
        pie={`${numero(v.hoy?.cantidad)} ventas`}
      />
      <TarjetaMetrica
        etiqueta="Ventas del mes"
        valor={moneda(v.mes?.monto)}
        pie={`${numero(v.mes?.cantidad)} ventas · semana ${moneda(v.semana?.monto)}`}
      />
      <TarjetaMetrica
        etiqueta="Ingresos totales"
        valor={moneda(data.ingresos_totales)}
        pie={`Año ${moneda(v.anio?.monto)}`}
      />
      <TarjetaMetrica
        etiqueta="Pendientes de pago"
        valor={numero(data.pedidos_pendientes_de_pago)}
        pie="pedidos sin confirmar"
      />
    </div>
  );
}
