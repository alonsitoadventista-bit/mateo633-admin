/**
 * api/pedidos.js  ->  backend: src/routes/pedidos.routes.js
 * Permiso: Panel (administrador o vendedor).
 *
 * Máquina de estados (backend src/utils/constants.js -> TRANSICIONES_PEDIDO):
 *   pendiente -> pagado | cancelado
 *   pagado    -> activo  | cancelado
 *   activo    -> vencido | cancelado
 *   vencido   -> (nada, pero admite renovar)
 *   cancelado -> (nada)
 */
import { api } from './client';

/** GET /admin/pedidos?estado= (opcional) */
export const listar = (estado) => api.get('/admin/pedidos', { estado });

/** GET /admin/pedidos/pendientes */
export const pendientes = () => api.get('/admin/pedidos/pendientes');

/** GET /admin/pedidos/vencimientos?dias=7 */
export const vencimientos = (dias = 7) => api.get('/admin/pedidos/vencimientos', { dias });

/** GET /admin/pedidos/:id */
export const detalle = (id) => api.get(`/admin/pedidos/${id}`);

/** GET /admin/pedidos/:id/pagos — pagos confirmados de este pedido */
export const pagos = (id) => api.get(`/admin/pedidos/${id}/pagos`);

/** GET /admin/pedidos/:id/auditoria — historial: quién hizo qué y cuándo */
export const auditoria = (id) => api.get(`/admin/pedidos/${id}/auditoria`);

/** GET /admin/pedidos/:id/renovaciones — cadena completa (bidireccional) */
export const renovaciones = (id) => api.get(`/admin/pedidos/${id}/renovaciones`);

/** POST /admin/pedidos — body: { cliente_id, plan_id }. El servicio y el precio los deriva el backend del plan. */
export const crear = ({ cliente_id, plan_id }) => api.post('/admin/pedidos', { cliente_id, plan_id });

/** PUT /admin/pedidos/:id/marcar-pagado — body: { monto, metodo, notas? } */
export const marcarPagado = (id, datos) => api.put(`/admin/pedidos/${id}/marcar-pagado`, datos);

/** PUT /admin/pedidos/:id/activar — calcula vencimiento y programa 3 recordatorios */
export const activar = (id) => api.put(`/admin/pedidos/${id}/activar`);

/** PUT /admin/pedidos/:id/cancelar */
export const cancelar = (id) => api.put(`/admin/pedidos/${id}/cancelar`);

/** POST /admin/pedidos/:id/renovar — crea un pedido nuevo enlazado al anterior */
export const renovar = (id) => api.post(`/admin/pedidos/${id}/renovar`);

/**
 * GET /admin/pedidos/:id/entrega — mensaje FINAL de entrega de credenciales
 * (datos de acceso + instrucciones + indicaciones de uso del servicio).
 * -> { texto, advertencia_incluida, cliente_nombre, cliente_whatsapp }
 */
export const mensajeEntrega = (id) => api.get(`/admin/pedidos/${id}/entrega`);

/** POST /admin/pedidos/:id/entrega — body: { canal: 'whatsapp' | 'copiado' }. Registra la entrega en el historial. */
export const registrarEntrega = (id, canal) => api.post(`/admin/pedidos/${id}/entrega`, { canal });

/** GET /admin/pedidos/:id/entregas — historial de entregas de credenciales. */
export const entregas = (id) => api.get(`/admin/pedidos/${id}/entregas`);
