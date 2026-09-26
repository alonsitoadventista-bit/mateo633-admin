/**
 * api/client.js
 * -----------------------------------------
 * Único punto de contacto con el backend. Todas las funciones de
 * api/*.js pasan por aquí.
 *
 * Contrato del backend (verificado en mateo633-backend):
 *   - Auth: header `Authorization: Bearer <jwt>`.
 *   - Errores: SIEMPRE `{ "error": "mensaje en español" }` + status HTTP.
 *       400 validación · 401 token · 403 rol · 404 no encontrado
 *       409 duplicado · 500 { error: "Error interno del servidor" }
 *   - 401 en cualquier endpoint => sesión inválida: se cierra y se
 *     redirige al login (ver notificar401), EXCEPTO en el propio
 *     POST /admin/login, donde 401 es "credenciales incorrectas"
 *     (error de negocio) y no hay sesión que cerrar.
 */

import { API_BASE_URL } from '../config';
import { obtenerToken, notificar401 } from '../auth/sesion';

/** Error normalizado que lanzan todas las llamadas fallidas. */
export class ErrorApi extends Error {
  constructor(mensaje, status, codigo = null) {
    super(mensaje || 'Error de conexión con el servidor');
    this.name = 'ErrorApi';
    this.status = status ?? 0;
    // Código de negocio opcional del backend (ej. PERFIL_RENOVACION_NO_CONSERVABLE).
    this.codigo = codigo;
  }
}

/**
 * @param {string} ruta          ej. '/admin/clientes'
 * @param {object} opciones
 * @param {string} opciones.method   GET | POST | PUT | DELETE
 * @param {any}    opciones.body     objeto JSON, o FormData (multipart), o undefined
 * @param {object} opciones.query    pares que se serializan a querystring
 * @param {boolean} opciones.raw     si true, devuelve la Response cruda (para descargas/CSV)
 */
export async function solicitar(ruta, opciones = {}) {
  const { method = 'GET', body, query, raw = false } = opciones;

  let url = `${API_BASE_URL}${ruta}`;
  if (query && typeof query === 'object') {
    const qs = new URLSearchParams();
    for (const [clave, valor] of Object.entries(query)) {
      if (valor !== undefined && valor !== null && valor !== '') qs.append(clave, valor);
    }
    const cadena = qs.toString();
    if (cadena) url += `?${cadena}`;
  }

  const headers = {};
  const token = obtenerToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let cuerpo;
  if (body instanceof FormData) {
    cuerpo = body; // el navegador pone el Content-Type con boundary
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    cuerpo = JSON.stringify(body);
  }

  let respuesta;
  try {
    respuesta = await fetch(url, { method, headers, body: cuerpo });
  } catch {
    throw new ErrorApi('No se pudo contactar al servidor. ¿El backend está corriendo?', 0);
  }

  // El 401 de /admin/login es un error de negocio (credenciales incorrectas),
  // no una sesión expirada: no hay sesión que cerrar ni token que invalidar.
  if (respuesta.status === 401 && ruta !== '/admin/login') {
    notificar401();
    throw new ErrorApi('Tu sesión expiró. Inicia sesión de nuevo.', 401);
  }

  if (raw) {
    if (!respuesta.ok) throw new ErrorApi(await leerMensajeError(respuesta), respuesta.status);
    return respuesta;
  }

  if (respuesta.status === 204) return null;

  const datos = await respuesta.json().catch(() => null);
  if (!respuesta.ok) {
    throw new ErrorApi(datos?.error || `Error ${respuesta.status}`, respuesta.status, datos?.codigo || null);
  }
  return datos;
}

async function leerMensajeError(respuesta) {
  const datos = await respuesta.json().catch(() => null);
  return datos?.error || `Error ${respuesta.status}`;
}

export const api = {
  get: (ruta, query) => solicitar(ruta, { method: 'GET', query }),
  post: (ruta, body) => solicitar(ruta, { method: 'POST', body }),
  put: (ruta, body) => solicitar(ruta, { method: 'PUT', body }),
  del: (ruta, body) => solicitar(ruta, { method: 'DELETE', body }),
  raw: (ruta, query) => solicitar(ruta, { method: 'GET', query, raw: true }),
};

/** GET /health — chequeo de conectividad y estado de la base de datos. */
export function salud() {
  return api.get('/health');
}

/**
 * Convierte una ruta relativa de archivo del backend (`/uploads/...`)
 * en URL absoluta usable en <img src>. Si ya es una URL http(s)
 * externa (imagen de catálogo puesta a mano), la devuelve tal cual.
 */
export function urlArchivo(rutaRelativa) {
  if (!rutaRelativa) return null;
  if (/^https?:\/\//i.test(rutaRelativa)) return rutaRelativa;
  return `${API_BASE_URL}${rutaRelativa}`;
}
