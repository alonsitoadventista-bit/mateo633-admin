/**
 * api/dashboard.js  ->  backend: src/routes/dashboard.routes.js
 * Permiso: Panel (administrador o vendedor).
 * Cada tarjeta del dashboard carga por separado (endpoints independientes).
 */
import { api } from './client';

/** GET /admin/dashboard/metricas — clientes, ventas por período, ingresos, pedidos pendientes. */
export const metricas = () => api.get('/admin/dashboard/metricas');

/**
 * GET /admin/dashboard/pagos-por-revisar
 * OJO: la LISTA de la bandeja "Pagos por revisar" vive aquí (controller
 * de dashboard). Las acciones aprobar/rechazar están en api/pagosPorRevisar.js.
 */
export const pagosPorRevisar = () => api.get('/admin/dashboard/pagos-por-revisar');

/** GET /admin/dashboard/servicios-vencidos — pedidos 'activo' con fecha_vencimiento pasada (calculado, no cambia estado). */
export const serviciosVencidos = () => api.get('/admin/dashboard/servicios-vencidos');

/** GET /admin/dashboard/servicios-mas-vendidos?limite=10 */
export const serviciosMasVendidos = (limite = 10) =>
  api.get('/admin/dashboard/servicios-mas-vendidos', { limite });

/** GET /admin/dashboard/ventas-por-vendedor */
export const ventasPorVendedor = () => api.get('/admin/dashboard/ventas-por-vendedor');
