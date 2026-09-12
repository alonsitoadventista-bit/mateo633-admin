/**
 * auth/sesion.js
 * -----------------------------------------
 * Almacén de sesión SIN React, para que la capa `api/` pueda leer el
 * token sin depender del árbol de componentes (evita import circular
 * entre api/client.js y AuthContext).
 *
 * La sesión es { token, admin: { id, nombre, usuario, rol } }, tal
 * como la devuelve POST /admin/login en el backend.
 */

import { LLAVE_SESION } from '../config';

let enMemoria = leerDeStorage();
const suscriptores401 = new Set();

function leerDeStorage() {
  try {
    const crudo = localStorage.getItem(LLAVE_SESION);
    return crudo ? JSON.parse(crudo) : null;
  } catch {
    return null;
  }
}

export function obtenerSesion() {
  return enMemoria;
}

export function obtenerToken() {
  return enMemoria?.token || null;
}

export function guardarSesion(sesion) {
  enMemoria = sesion;
  try {
    localStorage.setItem(LLAVE_SESION, JSON.stringify(sesion));
  } catch {
    /* modo privado / storage bloqueado: la sesión vive solo en memoria */
  }
}

export function borrarSesion() {
  enMemoria = null;
  try {
    localStorage.removeItem(LLAVE_SESION);
  } catch {
    /* no-op */
  }
}

/**
 * Registra un callback que se dispara cuando la API responde 401
 * (token ausente, inválido o expirado). AuthContext lo usa para
 * cerrar sesión y mandar al login.
 */
export function alRecibir401(callback) {
  suscriptores401.add(callback);
  return () => suscriptores401.delete(callback);
}

export function notificar401() {
  borrarSesion();
  suscriptores401.forEach((fn) => {
    try {
      fn();
    } catch {
      /* no-op */
    }
  });
}
