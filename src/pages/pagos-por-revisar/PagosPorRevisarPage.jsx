import { PlaceholderModulo } from '../../components/PlaceholderModulo';

export function PagosPorRevisarPage() {
  return (
    <PlaceholderModulo
      titulo="Pagos por revisar"
      fase={5}
      permiso="Panel (administrador o vendedor)"
      descripcion="Bandeja de pagos reportados por el cliente o por ManyChat, aún sin confirmar. Ver comprobante (imagen desde /uploads), aprobar (marca pagado + activa en un paso) o rechazar con motivo (el pedido queda pendiente)."
      endpoints={[
        'GET    /admin/dashboard/pagos-por-revisar   (la lista vive en el controller de dashboard)',
        'PUT    /admin/pagos-por-revisar/:pedidoId/aprobar',
        'PUT    /admin/pagos-por-revisar/:pedidoId/rechazar',
      ]}
    />
  );
}
