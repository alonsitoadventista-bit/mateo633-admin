import { PlaceholderModulo } from '../../components/PlaceholderModulo';

export function ConfiguracionPage() {
  return (
    <PlaceholderModulo
      titulo="Configuración"
      fase={9}
      permiso="SoloAdmin (rol 'administrador')"
      descripcion="Edición de las 14 claves precargadas (negocio / comercial / sistema). El valor es JSONB tipado: editores distintos para texto, URL, objeto (redes_sociales, datos_bancarios) y arreglo (metodos_pago). No se pueden crear claves nuevas. Ver src/utils/configuracionClaves.js."
      endpoints={['GET    /admin/configuracion?categoria=', 'PUT    /admin/configuracion/:clave']}
    />
  );
}
