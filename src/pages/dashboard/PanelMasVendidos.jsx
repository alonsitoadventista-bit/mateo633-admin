/**
 * pages/dashboard/PanelMasVendidos.jsx  (Fase 2)
 * -----------------------------------------
 * GET /admin/dashboard/servicios-mas-vendidos?limite=10  (límite fijo).
 * Ranking por pedidos pagados. Filas: { id, nombre, categoria,
 * cantidad_vendida, ingresos_generados }.
 */
import { useApi } from '../../hooks/useApi';
import * as dashboardApi from '../../api/dashboard';
import { Tarjeta, Tabla, EstadoCarga, EstadoError, EstadoVacio } from '../../components/ui';
import { moneda, numero } from '../../utils/formato';

const LIMITE = 10;

export function PanelMasVendidos({ recargar }) {
  const { data, cargando, error, refetch } = useApi(
    () => dashboardApi.serviciosMasVendidos(LIMITE),
    [recargar]
  );
  const filas = Array.isArray(data) ? data : [];

  return (
    <Tarjeta titulo={`Servicios más vendidos (top ${LIMITE})`}>
      {error ? (
        <EstadoError error={error} onReintentar={refetch} />
      ) : cargando && !data ? (
        <EstadoCarga />
      ) : filas.length === 0 ? (
        <EstadoVacio titulo="Sin datos" descripcion="Todavía no hay pedidos pagados." />
      ) : (
        <Tabla
          claveFila={(f) => f.id}
          filas={filas}
          columnas={[
            { clave: 'pos', titulo: '#', render: (_f, i) => i + 1 },
            { clave: 'nombre', titulo: 'Servicio' },
            { clave: 'categoria', titulo: 'Categoría', render: (f) => f.categoria || '—' },
            {
              clave: 'cantidad_vendida',
              titulo: 'Vendidos',
              render: (f) => numero(f.cantidad_vendida),
            },
            {
              clave: 'ingresos_generados',
              titulo: 'Ingresos',
              render: (f) => moneda(f.ingresos_generados),
            },
          ]}
        />
      )}
    </Tarjeta>
  );
}
