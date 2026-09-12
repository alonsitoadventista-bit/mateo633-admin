import { PlaceholderModulo } from '../../components/PlaceholderModulo';

export function PedidosPage() {
  return (
    <PlaceholderModulo
      titulo="Pedidos"
      fase={4}
      permiso="Panel (administrador o vendedor)"
      descripcion="Lista general y vistas de pendientes / próximos a vencer. Detalle con pagos, auditoría y cadena de renovaciones. Alta (cliente + plan). Acciones gobernadas por la máquina de estados: marcar pagado, activar, cancelar, renovar."
      endpoints={[
        'GET    /admin/pedidos?estado=',
        'GET    /admin/pedidos/pendientes',
        'GET    /admin/pedidos/vencimientos?dias=7',
        'GET    /admin/pedidos/:id',
        'GET    /admin/pedidos/:id/pagos',
        'GET    /admin/pedidos/:id/auditoria',
        'GET    /admin/pedidos/:id/renovaciones',
        'POST   /admin/pedidos',
        'PUT    /admin/pedidos/:id/marcar-pagado',
        'PUT    /admin/pedidos/:id/activar',
        'PUT    /admin/pedidos/:id/cancelar',
        'POST   /admin/pedidos/:id/renovar',
      ]}
    />
  );
}
