/**
 * api/servicios.js  ->  backend: src/routes/servicios.routes.js
 * Permiso: SoloAdmin (rol 'administrador'). Un 'vendedor' recibe 403
 * incluso en lectura -> el panel oculta este módulo para vendedores.
 */
import { api, solicitar } from './client';

/** GET /admin/servicios — todos, incluye inactivos */
export const listar = () => api.get('/admin/servicios');

/** GET /admin/servicios/:id — servicio + TODOS sus planes (activos e inactivos) */
export const detalle = (id) => api.get(`/admin/servicios/${id}`);

/** POST /admin/servicios — body: { nombre, descripcion?, categoria? } */
export const crear = (datos) => api.post('/admin/servicios', datos);

/** PUT /admin/servicios/:id — body parcial: { nombre?, descripcion?, categoria? } */
export const actualizar = (id, datos) => api.put(`/admin/servicios/${id}`, datos);

/** DELETE /admin/servicios/:id — desactiva (soft-delete) */
export const desactivar = (id) => api.del(`/admin/servicios/${id}`);

/** PUT /admin/servicios/:id/activar */
export const activar = (id) => api.put(`/admin/servicios/${id}/activar`);

/**
 * POST /admin/servicios/:id/imagen — multipart, campo "imagen".
 * Máx 3 MB, solo image/*. Devuelve el servicio con imagen_url nueva.
 */
export const subirImagen = (id, archivo) => {
  const fd = new FormData();
  fd.append('imagen', archivo);
  return solicitar(`/admin/servicios/${id}/imagen`, { method: 'POST', body: fd });
};

/** DELETE /admin/servicios/:id/imagen — quita la imagen (vuelve a null) */
export const eliminarImagen = (id) => api.del(`/admin/servicios/${id}/imagen`);

/* --- Planes (cuelgan de un servicio) --- */

/** POST /admin/servicios/:id/planes — body: { duracion_dias, precio } */
export const crearPlan = (servicioId, datos) => api.post(`/admin/servicios/${servicioId}/planes`, datos);

/** PUT /admin/planes/:id — body parcial: { duracion_dias?, precio?, activo? } */
export const actualizarPlan = (planId, datos) => api.put(`/admin/planes/${planId}`, datos);

/** DELETE /admin/planes/:id — desactiva el plan */
export const desactivarPlan = (planId) => api.del(`/admin/planes/${planId}`);

/** PUT /admin/planes/:id/activar */
export const activarPlan = (planId) => api.put(`/admin/planes/${planId}/activar`);
