import { PlaceholderModulo } from '../../components/PlaceholderModulo';

export function ServiciosPage() {
  return (
    <PlaceholderModulo
      titulo="Servicios y Planes"
      fase={6}
      permiso="SoloAdmin (rol 'administrador')"
      descripcion="Catálogo completo (incluye inactivos). CRUD de servicios y de sus planes (duración/precio), activar/desactivar (soft-delete), y subida/eliminación de imagen del servicio (multipart, campo 'imagen', máx 3 MB)."
      endpoints={[
        'GET    /admin/servicios',
        'GET    /admin/servicios/:id',
        'POST   /admin/servicios',
        'PUT    /admin/servicios/:id',
        'DELETE /admin/servicios/:id            (desactiva)',
        'PUT    /admin/servicios/:id/activar',
        'POST   /admin/servicios/:id/imagen     (multipart: imagen)',
        'DELETE /admin/servicios/:id/imagen',
        'POST   /admin/servicios/:id/planes',
        'PUT    /admin/planes/:id',
        'DELETE /admin/planes/:id               (desactiva)',
        'PUT    /admin/planes/:id/activar',
      ]}
    />
  );
}
