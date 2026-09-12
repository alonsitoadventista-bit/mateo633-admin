/**
 * utils/constantes.js
 * -----------------------------------------
 * ESPEJO de mateo633-backend/src/utils/constants.js.
 * Si cambia allá (o los CHECK de las migraciones), actualizar aquí.
 * El backend sigue siendo la autoridad: estas listas son solo para
 * poblar selects y decidir qué botones mostrar.
 */

export const ESTADOS_CLIENTE = ['activo', 'inactivo', 'bloqueado'];

export const ESTADOS_PEDIDO = ['pendiente', 'pagado', 'activo', 'vencido', 'cancelado'];

/** Desde qué estado se puede pasar a cuál (gobierna los botones de acción del pedido). */
export const TRANSICIONES_PEDIDO = {
  pendiente: ['pagado', 'cancelado'],
  pagado: ['activo', 'cancelado'],
  activo: ['vencido', 'cancelado'],
  vencido: [],
  cancelado: [],
};

export const TIPOS_PAGO = ['total', 'parcial'];

export const ROLES_ADMIN = ['administrador', 'vendedor'];

export const TIPOS_ACTOR = ['administrador', 'vendedor', 'cliente', 'sistema'];

export const CATEGORIAS_CONFIG = ['negocio', 'comercial', 'sistema'];

/**
 * Catálogo de acciones de auditoría (para el filtro del módulo Auditoría).
 * Tomado de mateo633-backend/docs/ENDPOINTS.md.
 */
export const ACCIONES_AUDITORIA = [
  'pedido_creado',
  'pago_confirmado',
  'pago_rechazado',
  'pago_reportado_manychat',
  'pago_reportado_cliente',
  'servicio_activado',
  'pedido_cancelado',
  'servicio_creado',
  'servicio_editado',
  'servicio_desactivado',
  'servicio_imagen_actualizada',
  'servicio_imagen_eliminada',
  'plan_creado',
  'plan_editado',
  'plan_desactivado',
  'plan_activado',
  'cliente_registrado_por_staff',
  'datos_cliente_editados',
  'estado_cliente_cambiado',
  'usuario_creado',
  'usuario_editado',
  'usuario_activado',
  'usuario_desactivado',
  'password_restablecida',
  'configuracion_actualizada',
  'ticket_creado',
  'recordatorio_enviado',
  'recordatorio_omitido',
  'recordatorio_fallido',
  'servicio_consultado',
  'etiquetas_sincronizadas',
];

/** Clases Tailwind por estado, para <Etiqueta>. */
export const COLOR_ESTADO_PEDIDO = {
  pendiente: 'amber',
  pagado: 'blue',
  activo: 'green',
  vencido: 'red',
  cancelado: 'gray',
};

export const COLOR_ESTADO_CLIENTE = {
  activo: 'green',
  inactivo: 'gray',
  bloqueado: 'red',
};

/**
 * ¿Qué transiciones de estado ofrece la UI para un pedido?
 * (El botón "Renovar" es aparte: crea un pedido nuevo, no es transición.)
 */
export function accionesDisponiblesPedido(estado) {
  return TRANSICIONES_PEDIDO[estado] || [];
}
