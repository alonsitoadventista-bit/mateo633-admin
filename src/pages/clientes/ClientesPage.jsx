import { PlaceholderModulo } from '../../components/PlaceholderModulo';

export function ClientesPage() {
  return (
    <PlaceholderModulo
      titulo="Clientes"
      fase={3}
      permiso="Panel (administrador o vendedor)"
      descripcion="Lista con filtro por estado, alta desde el panel, detalle con pestañas (pedidos, pagos confirmados, recordatorios), edición de datos y cambio de estado (activo/inactivo/bloqueado)."
      endpoints={[
        'GET    /admin/clientes?estado=',
        'POST   /admin/clientes',
        'GET    /admin/clientes/:id',
        'PUT    /admin/clientes/:id',
        'PUT    /admin/clientes/:id/estado',
        'GET    /admin/clientes/:id/pedidos',
        'GET    /admin/clientes/:id/pagos',
        'GET    /admin/clientes/:id/recordatorios',
      ]}
    />
  );
}
