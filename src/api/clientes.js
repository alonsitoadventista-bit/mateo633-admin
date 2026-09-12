/**
 * api/clientes.js  ->  backend: src/routes/clientes.routes.js
 * Permiso: Panel (administrador o vendedor).
 */
import { api } from './client';

/** GET /admin/clientes?estado=activo|inactivo|bloqueado (estado opcional) */
export const listar = (estado) => api.get('/admin/clientes', { estado });

/** GET /admin/clientes/:id */
export const detalle = (id) => api.get(`/admin/clientes/${id}`);

/** POST /admin/clientes — body: { nombre, whatsapp, email? }. nombre y whatsapp obligatorios; whatsapp único (+52...). */
export const crear = (datos) => api.post('/admin/clientes', datos);

/** PUT /admin/clientes/:id — body: { nombre?, email?, whatsapp? } */
export const actualizarDatos = (id, datos) => api.put(`/admin/clientes/${id}`, datos);

/** PUT /admin/clientes/:id/estado — body: { estado } */
export const actualizarEstado = (id, estado) => api.put(`/admin/clientes/${id}/estado`, { estado });

/** GET /admin/clientes/:id/pedidos — historial completo de pedidos */
export const pedidos = (id) => api.get(`/admin/clientes/${id}/pedidos`);

/** GET /admin/clientes/:id/pagos — pagos CONFIRMADOS (dinero real) */
export const pagos = (id) => api.get(`/admin/clientes/${id}/pagos`);

/** GET /admin/clientes/:id/recordatorios — avisos de renovación futuros no enviados */
export const recordatorios = (id) => api.get(`/admin/clientes/${id}/recordatorios`);
