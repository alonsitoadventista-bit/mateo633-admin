/**
 * api/inventario.js  ->  backend: src/routes/inventario.routes.js + src/routes/pedidos.routes.js
 * Permiso: Panel (administrador o vendedor).
 *
 * Fase 1: solo tipo_gestion='perfil' tiene asignación automática. La
 * asignación en sí ocurre sola al activar un pedido (ver api/pedidos.js
 * activar()/PagosPorRevisar.aprobar()) -- estas funciones son para
 * gestionar el inventario y el fallback manual.
 */
import { api } from './client';

/** GET /admin/inventario?servicio_id=&estado= */
export const listar = (filtros = {}) => api.get('/admin/inventario', filtros);

/** POST /admin/inventario -- body: { servicio_id, tipo_gestion?, identificador_cuenta, contrasena, numero_perfil?, pin_perfil?, costo?, fecha_inicio?, fecha_vence?, proveedor?, celular_proveedor?, notas_internas? } */
export const crear = (datos) => api.post('/admin/inventario', datos);

/** GET /admin/inventario/:id?incluirContrasena=true */
export const detalle = (id, incluirContrasena = false) =>
  api.get(`/admin/inventario/${id}`, incluirContrasena ? { incluirContrasena: 'true' } : {});

/** PUT /admin/inventario/:id/liberar -- solo válido si el inventario está "vencido" (confirma que ya se rotó la contraseña real). */
export const liberar = (id) => api.put(`/admin/inventario/${id}/liberar`);

/** GET /admin/pedidos/:id/inventario -- qué perfil tiene (o tuvo) asignado ese pedido. null si nunca se le asignó nada. */
export const porPedido = (pedidoId) => api.get(`/admin/pedidos/${pedidoId}/inventario`);

/** GET /admin/pedidos/:id/inventario/historial */
export const historialPorPedido = (pedidoId) => api.get(`/admin/pedidos/${pedidoId}/inventario/historial`);

/** PUT /admin/pedidos/:id/inventario/asignar -- body: { inventario_id }. Fallback manual si no hubo asignación automática. */
export const asignarManual = (pedidoId, inventario_id) =>
  api.put(`/admin/pedidos/${pedidoId}/inventario/asignar`, { inventario_id });

/**
 * PUT /admin/pedidos/:id/inventario/entrega-manual -- botón de EMERGENCIA:
 * crea un perfil de inventario nuevo (ad-hoc) y lo asigna de inmediato.
 * body: { identificador_cuenta, contrasena, numero_perfil?, pin_perfil?, notas_internas? }
 */
export const entregaManual = (pedidoId, datos) =>
  api.put(`/admin/pedidos/${pedidoId}/inventario/entrega-manual`, datos);
