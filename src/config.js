/**
 * config.js
 * -----------------------------------------
 * Configuración de entorno del panel. Único lugar que lee import.meta.env.
 */

/**
 * Base de la API. En desarrollo queda '' y las llamadas salen relativas
 * (`/admin/...`), que el proxy de Vite reenvía al backend en :3000.
 * En producción se define VITE_API_URL con la URL pública del backend.
 */
export const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

/** Clave de localStorage donde se guarda la sesión (token + datos del admin). */
export const LLAVE_SESION = 'mateo633_admin_sesion';

/** Nombre visible del producto (se puede sobrescribir luego desde /admin/configuracion). */
export const NOMBRE_APP = 'Mateo 6:33 Premium';
