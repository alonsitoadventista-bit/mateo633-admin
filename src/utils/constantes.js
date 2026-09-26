/**
 * utils/constantes.js
 * -----------------------------------------
 * ESPEJO de mateo633-backend/src/utils/constants.js.
 * Si cambia allá (o los CHECK de las migraciones), actualizar aquí.
 * El backend sigue siendo la autoridad: estas listas son solo para
 * poblar selects y decidir qué botones mostrar.
 */

export const ESTADOS_CLIENTE = ['activo', 'inactivo', 'bloqueado'];

export const ESTADOS_PEDIDO = ['pendiente', 'pagado', 'activo', 'vencido', 'cancelado', 'renovado'];

/** Desde qué estado se puede pasar a cuál (gobierna los botones de acción del pedido). */
export const TRANSICIONES_PEDIDO = {
  pendiente: ['pagado', 'cancelado'],
  pagado: ['activo', 'cancelado'],
  activo: ['vencido', 'cancelado', 'renovado'],
  vencido: ['renovado'],
  cancelado: [],
  renovado: [],
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
  'perfil_asignado',
  'cuenta_liberada',
  'entrega_manual_emergencia',
  'pedido_vencido',
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
  // Migración 023: reemplazado por su renovación confirmada (el servicio sigue en la renovación).
  renovado: 'gray',
};

/** Clases Tailwind por estado del inventario (Fase 1). */
export const COLOR_ESTADO_INVENTARIO = {
  disponible: 'green',
  asignado: 'blue',
  vencido: 'red',
  bloqueado: 'gray',
};

export const COLOR_ESTADO_CLIENTE = {
  activo: 'green',
  inactivo: 'gray',
  bloqueado: 'red',
};

/**
 * Módulo Clientes (CRM). `clientes.estado` se muestra como "Acceso" para no
 * confundirlo con el estado COMERCIAL (que calcula el backend desde los pedidos).
 */
export const TEXTO_ACCESO_CLIENTE = {
  activo: 'Habilitado',
  inactivo: 'Deshabilitado',
  bloqueado: 'Bloqueado',
};

/** Espejo de ESTADOS_COMERCIALES y sus umbrales en backend/src/utils/constants.js. */
export const ESTADOS_COMERCIALES = {
  activo: {
    texto: 'Al día',
    punto: 'bg-emerald-400',
    clase: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300',
    ayuda: 'Tiene al menos un servicio vigente y ninguno vence en los próximos 7 días.',
  },
  proximo_a_vencer: {
    texto: 'Por vencer',
    punto: 'bg-amber-400',
    clase: 'border-amber-500/40 bg-amber-500/15 text-amber-300',
    ayuda: 'Algún servicio vence en 7 días o menos. Buen momento para ofrecer la renovación.',
  },
  vencido: {
    texto: 'Vencido',
    punto: 'bg-rose-500',
    clase: 'border-rose-500/40 bg-rose-500/15 text-rose-300',
    ayuda: 'Ya no tiene servicios vigentes; el último venció hace 30 días o menos. Todavía es fácil recuperarlo.',
  },
  inactivo: {
    texto: 'Inactivo',
    punto: 'bg-slate-500',
    clase: 'border-white/10 bg-white/[0.04] text-texto-suave',
    ayuda: 'Nunca activó un servicio, o el último venció hace más de 30 días.',
  },
};

/** Próxima acción recomendada (la calcula el backend: services/clientesService.js). */
export const ACCIONES_CLIENTE = {
  renovar: { icono: 'actualizar', clase: 'border-marca-500/40 bg-marca-500/15 text-marca-400' },
  contactar: { icono: 'whatsapp', clase: 'border-amber-500/40 bg-amber-500/15 text-amber-300' },
  esperar: { icono: 'reloj', clase: 'border-sky-500/40 bg-sky-500/15 text-sky-300' },
  recuperar: { icono: 'fuego', clase: 'border-rose-500/40 bg-rose-500/15 text-rose-300' },
  ninguna: { icono: 'check', clase: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' },
};

/**
 * ¿Qué transiciones de estado ofrece la UI para un pedido?
 * (El botón "Renovar" es aparte: crea un pedido nuevo, no es transición.)
 */
export function accionesDisponiblesPedido(estado) {
  return TRANSICIONES_PEDIDO[estado] || [];
}
