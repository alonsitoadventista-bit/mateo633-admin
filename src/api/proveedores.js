/**
 * api/proveedores.js  ->  backend: src/routes/proveedores.routes.js
 * Permiso: SoloAdmin (rol 'administrador'). Un 'vendedor' recibe 403
 * incluso en lectura -> el panel oculta este módulo para vendedores.
 */
import { api } from './client';

/** GET /admin/proveedores — todos, incluye inactivos */
export const listar = () => api.get('/admin/proveedores');

/** POST /admin/proveedores — body: { nombre, contacto?, notas? } */
export const crear = (datos) => api.post('/admin/proveedores', datos);

/** PUT /admin/proveedores/:id — body parcial: { nombre?, contacto?, notas? } */
export const actualizar = (id, datos) => api.put(`/admin/proveedores/${id}`, datos);

/** DELETE /admin/proveedores/:id — desactiva (soft-delete) */
export const desactivar = (id) => api.del(`/admin/proveedores/${id}`);

/** PUT /admin/proveedores/:id/activar */
export const activar = (id) => api.put(`/admin/proveedores/${id}/activar`);
