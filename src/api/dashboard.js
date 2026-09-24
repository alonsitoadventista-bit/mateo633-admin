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

/* --- Dashboard nuevo (2026-09-24). Todo en hora de Lima; fechas de calendario como 'YYYY-MM-DD'. --- */

/** GET /admin/dashboard/resumen — las 4 tarjetas: ventas_dia, servicios_activos, pedidos_pendientes, por_vencer. */
export const resumen = () => api.get('/admin/dashboard/resumen');

/** GET /admin/dashboard/ganancias — SOLO administrador. { periodos: { dia, semana, mes, anio }, cuentas_con_costo_sin_fecha }. */
export const ganancias = () => api.get('/admin/dashboard/ganancias');

/** GET /admin/dashboard/ventas-serie?rango=7d|30d|12m — { rango, unidad, puntos: [{ fecha, ventas, pedidos }] }. */
export const ventasSerie = (rango = '30d') => api.get('/admin/dashboard/ventas-serie', { rango });

/** GET /admin/dashboard/inventario — estado del inventario por servicio. */
export const inventario = () => api.get('/admin/dashboard/inventario');

/** GET /admin/dashboard/ultimos-pedidos?limite=7 */
export const ultimosPedidos = (limite = 7) => api.get('/admin/dashboard/ultimos-pedidos', { limite });

/** GET /admin/dashboard/alertas — [{ clave, nivel, titulo, detalle, cantidad, enlace }]. */
export const alertas = () => api.get('/admin/dashboard/alertas');

/** GET /admin/dashboard/servicios-mas-vendidos?limite=&dias= (dias opcional: sin él, todo el historial). */
export const masVendidos = (limite = 6, dias = 30) =>
  api.get('/admin/dashboard/servicios-mas-vendidos', dias ? { limite, dias } : { limite });
