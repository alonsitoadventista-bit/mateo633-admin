/**
 * pages/dashboard/PanelVentasPorVendedor.jsx  (Fase 2)
 * -----------------------------------------
 * GET /admin/dashboard/ventas-por-vendedor
 * Filas: { vendedor_id, vendedor_nombre, rol, cantidad_pagos, monto_total }.
 *
 * DECISIÓN DE NEGOCIO: este panel solo se muestra al rol
 * 'administrador' (el gating vive en DashboardPage). El backend no lo
 * restringe, pero un vendedor no debe ver las cifras de sus compañeros.
 */
import { useApi } from '../../hooks/useApi';
import * as dashboardApi from '../../api/dashboard';
import { Tarjeta, Tabla, Etiqueta, EstadoCarga, EstadoError, EstadoVacio } from '../../components/ui';
import { moneda, numero, humanizar } from '../../utils/formato';

export function PanelVentasPorVendedor({ recargar }) {
  const { data, cargando, error, refetch } = useApi(() => dashboardApi.ventasPorVendedor(), [recargar]);
  const filas = Array.isArray(data) ? data : [];

  return (
    <Tarjeta titulo="Ventas por vendedor">
      {error ? (
        <EstadoError error={error} onReintentar={refetch} />
      ) : cargando && !data ? (
        <EstadoCarga />
      ) : filas.length === 0 ? (
        <EstadoVacio titulo="Sin datos" descripcion="Aún no hay pagos registrados por ningún usuario." />
      ) : (
        <Tabla
          claveFila={(f) => f.vendedor_id}
          filas={filas}
          columnas={[
            { clave: 'vendedor_nombre', titulo: 'Usuario' },
            { clave: 'rol', titulo: 'Rol', render: (f) => <Etiqueta>{humanizar(f.rol)}</Etiqueta> },
            { clave: 'cantidad_pagos', titulo: 'Pagos', render: (f) => numero(f.cantidad_pagos) },
            { clave: 'monto_total', titulo: 'Monto total', render: (f) => moneda(f.monto_total) },
          ]}
        />
      )}
    </Tarjeta>
  );
}
