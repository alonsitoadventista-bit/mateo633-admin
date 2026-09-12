import { PlaceholderModulo } from '../../components/PlaceholderModulo';

export function AuditoriaPage() {
  return (
    <PlaceholderModulo
      titulo="Auditoría"
      fase={8}
      permiso="SoloAdmin (rol 'administrador')"
      descripcion="Bitácora de todo el sistema con filtros combinables (módulo, actor, acción, búsqueda de texto, rango de fechas) y paginación server-side (único endpoint del panel con limite/offset). Exportación a CSV con los mismos filtros."
      endpoints={[
        'GET    /admin/auditoria?tabla_afectada=&actor_tipo=&actor_id=&accion=&busqueda=&desde=&hasta=&limite=&offset=',
        'GET    /admin/auditoria/exportar   (CSV, requiere Authorization -> descarga vía blob)',
      ]}
    />
  );
}
