/**
 * pages/dashboard/PanelPagosPorRevisar.jsx  (Fase 2)
 * -----------------------------------------
 * GET /admin/dashboard/pagos-por-revisar  (la lista vive en el
 * controller de dashboard; las acciones aprobar/rechazar son de la
 * Fase 5). Filas: { pedido_id, cliente_nombre, servicio_nombre,
 * precio_pagado, detalles (jsonb), origen_reporte, reportado_por_tipo,
 * fecha_reporte, ... }.
 */
import { Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import * as dashboardApi from '../../api/dashboard';
import { Tarjeta, Tabla, Etiqueta, EstadoCarga, EstadoError, EstadoVacio } from '../../components/ui';
import { fechaHora, humanizar, moneda } from '../../utils/formato';

const ORIGEN = {
  pago_reportado_cliente: 'App del cliente',
  pago_reportado_manychat: 'ManyChat',
};

const TOPE_VISIBLE = 5;

export function PanelPagosPorRevisar({ recargar }) {
  const { data, cargando, error, refetch } = useApi(() => dashboardApi.pagosPorRevisar(), [recargar]);
  const filas = Array.isArray(data) ? data : [];

  return (
    <Tarjeta
      titulo={`Pagos por revisar${filas.length ? ` · ${filas.length}` : ''}`}
      acciones={
        <Link to="/pagos-por-revisar" className="text-xs font-medium text-marca-700 hover:underline">
          Ver bandeja
        </Link>
      }
    >
      {error ? (
        <EstadoError error={error} onReintentar={refetch} />
      ) : cargando && !data ? (
        <EstadoCarga />
      ) : filas.length === 0 ? (
        <EstadoVacio titulo="Nada pendiente" descripcion="No hay pagos reportados sin revisar." />
      ) : (
        <>
          <Tabla
            claveFila={(f) => f.pedido_id}
            filas={filas.slice(0, TOPE_VISIBLE)}
            columnas={[
              { clave: 'cliente_nombre', titulo: 'Cliente' },
              { clave: 'servicio_nombre', titulo: 'Servicio' },
              {
                clave: 'monto',
                titulo: 'Monto',
                render: (f) => moneda(f.detalles?.monto ?? f.precio_pagado),
              },
              {
                clave: 'origen',
                titulo: 'Origen',
                render: (f) => (
                  <Etiqueta color="blue">{ORIGEN[f.origen_reporte] || humanizar(f.origen_reporte)}</Etiqueta>
                ),
              },
              { clave: 'fecha_reporte', titulo: 'Reportado', render: (f) => fechaHora(f.fecha_reporte) },
            ]}
          />
          {filas.length > TOPE_VISIBLE && (
            <p className="mt-2 text-xs text-slate-500">
              +{filas.length - TOPE_VISIBLE} más en la bandeja
            </p>
          )}
        </>
      )}
    </Tarjeta>
  );
}
