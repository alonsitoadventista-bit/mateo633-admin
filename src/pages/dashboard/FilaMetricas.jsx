/**
 * pages/dashboard/FilaMetricas.jsx  (Fase 2)
 * -----------------------------------------
 * GET /admin/dashboard/metricas
 * Respuesta: { clientes_totales, clientes_activos,
 *   ventas: { hoy:{monto,cantidad}, semana:{monto}, mes:{monto,cantidad}, anio:{monto} },
 *   ingresos_totales, pedidos_pendientes_de_pago }
 *
 * 4 tarjetas (mismo criterio visual que la referencia: un color de
 * icono distinto por tipo -- dorado/dorado/rojo/verde). Nota: el
 * backend no calcula variación % vs. periodo anterior, así que estas
 * tarjetas muestran los valores reales tal cual los expone la API --
 * no se inventan indicadores de crecimiento sin datos reales detrás.
 */
import { useApi } from '../../hooks/useApi';
import * as dashboardApi from '../../api/dashboard';
import { IconoNav } from '../../components/IconoNav.jsx';
import { TarjetaMetrica, EstadoCarga, EstadoError } from '../../components/ui';
import { moneda, numero } from '../../utils/formato';

export function FilaMetricas({ recargar }) {
  const { data, cargando, error, refetch } = useApi(() => dashboardApi.metricas(), [recargar]);

  if (error) return <EstadoError error={error} onReintentar={refetch} />;
  if (cargando && !data) return <EstadoCarga texto="Cargando métricas…" />;
  if (!data) return null;

  const v = data.ventas || {};

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <TarjetaMetrica
        colorIcono="dorado"
        icono={<IconoNav nombre="clientes" className="h-5 w-5" />}
        etiqueta="Clientes"
        valor={numero(data.clientes_totales)}
        pie={`${numero(data.clientes_activos)} activos`}
      />
      <TarjetaMetrica
        colorIcono="dorado"
        icono={<IconoNav nombre="pedidos" className="h-5 w-5" />}
        etiqueta="Ventas del mes"
        valor={moneda(v.mes?.monto)}
        pie={`Hoy ${moneda(v.hoy?.monto)} · Semana ${moneda(v.semana?.monto)}`}
      />
      <TarjetaMetrica
        colorIcono="rojo"
        icono={<IconoNav nombre="pagos" className="h-5 w-5" />}
        etiqueta="Pagos por revisar"
        valor={numero(data.pedidos_pendientes_de_pago)}
        pie="pedidos sin confirmar"
      />
      <TarjetaMetrica
        colorIcono="verde"
        icono={<IconoNav nombre="servicios" className="h-5 w-5" />}
        etiqueta="Ingresos totales"
        valor={moneda(data.ingresos_totales)}
        pie={`Año ${moneda(v.anio?.monto)}`}
      />
    </div>
  );
}
