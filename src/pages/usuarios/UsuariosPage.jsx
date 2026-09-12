import { PlaceholderModulo } from '../../components/PlaceholderModulo';

export function UsuariosPage() {
  return (
    <PlaceholderModulo
      titulo="Vendedores / Usuarios del panel"
      fase={7}
      permiso="SoloAdmin (rol 'administrador'), incluida la lectura"
      descripcion="Alta de cuentas de staff (administrador/vendedor), edición de datos, activar/desactivar (no la propia), restablecer contraseña (mín. 6), y detalle con pedidos gestionados y pagos registrados por ese usuario."
      endpoints={[
        'GET    /admin/usuarios',
        'POST   /admin/usuarios',
        'GET    /admin/usuarios/:id',
        'PUT    /admin/usuarios/:id',
        'PUT    /admin/usuarios/:id/activar',
        'PUT    /admin/usuarios/:id/desactivar',
        'PUT    /admin/usuarios/:id/restablecer-password',
        'GET    /admin/usuarios/:id/pedidos',
        'GET    /admin/usuarios/:id/pagos',
      ]}
    />
  );
}
