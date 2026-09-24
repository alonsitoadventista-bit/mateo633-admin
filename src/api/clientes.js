/**
 * api/clientes.js  ->  backend: src/routes/clientes.routes.js
 * Permiso: Panel (administrador o vendedor).
 */
import { api } from './client';

/** GET /admin/clientes?estado=activo|inactivo|bloqueado (estado opcional) */
export const listar = (estado) => api.get('/admin/clientes', { estado });

/** GET /admin/clientes/:id */
export const detalle = (id) => api.get(`/admin/clientes/${id}`);

/** POST /admin/clientes — body: { nombre, whatsapp, email? }. nombre y whatsapp obligatorios; whatsapp único; el backend lo guarda normalizado (+51...). */
export const crear = (datos) => api.post('/admin/clientes', datos);

/** PUT /admin/clientes/:id — body: { nombre?, email?, whatsapp? }. email null = borrarlo. */
export const actualizarDatos = (id, datos) => api.put(`/admin/clientes/${id}`, datos);

/** PUT /admin/clientes/:id/estado — body: { estado } */
export const actualizarEstado = (id, estado) => api.put(`/admin/clientes/${id}/estado`, { estado });

/** GET /admin/clientes/:id/pedidos — historial completo de pedidos */
export const pedidos = (id) => api.get(`/admin/clientes/${id}/pedidos`);

/** GET /admin/clientes/:id/pagos — pagos CONFIRMADOS (dinero real) */
export const pagos = (id) => api.get(`/admin/clientes/${id}/pagos`);

/** GET /admin/clientes/:id/recordatorios — avisos de renovación futuros no enviados */
export const recordatorios = (id) => api.get(`/admin/clientes/${id}/recordatorios`);

// --- Módulo Clientes (CRM) ---

/** GET /admin/clientes/tarjetas — { total, vigentes, activos, proximos_a_vencer, vencen_hoy, vencidos, inactivos, nuevos_mes } */
export const tarjetas = () => api.get('/admin/clientes/tarjetas');

/**
 * GET /admin/clientes/listado — { total, pagina, por_pagina, filas }.
 * filtros: { q, estado_comercial (uno, varios con coma, o "vigentes"), acceso, orden: urgencia|nombre|recientes, pagina, por_pagina }
 */
export const listado = (filtros) => api.get('/admin/clientes/listado', filtros);

/** GET /admin/clientes/:id/resumen — resumen rápido, próxima acción y etiquetas de la ficha */
export const resumen = (id) => api.get(`/admin/clientes/${id}/resumen`);

/** GET /admin/clientes/:id/servicios — vigentes y pendientes, con perfil asignado (sin contraseñas) */
export const servicios = (id) => api.get(`/admin/clientes/${id}/servicios`);

/** GET /admin/clientes/:id/historial — línea de tiempo del cliente y sus pedidos */
export const historial = (id) => api.get(`/admin/clientes/${id}/historial`);

/** GET /admin/clientes/:id/comunicaciones — entregas de credenciales y recordatorios automáticos */
export const comunicaciones = (id) => api.get(`/admin/clientes/${id}/comunicaciones`);

/** GET /admin/clientes/:id/mensajes — mensajes preparados: recordar_renovacion, recuperar_cliente, bienvenida */
export const mensajes = (id) => api.get(`/admin/clientes/${id}/mensajes`);
