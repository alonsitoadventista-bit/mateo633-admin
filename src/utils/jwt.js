/**
 * utils/jwt.js
 * -----------------------------------------
 * Decodificación del JWT SOLO para UI (mostrar el rol, saber cuándo
 * expira). NUNCA es autoridad de seguridad: el backend valida el
 * token de verdad en cada request (middleware/auth.middleware.js).
 *
 * Payload que emite el backend (auth.controller.js):
 *   { id, usuario, rol, tipo, iat, exp }   // tipo === rol
 */

export function decodificarPayload(token) {
  try {
    const segmento = token.split('.')[1];
    const base64 = segmento.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/** true si el token no existe, es ilegible o su `exp` ya pasó. */
export function estaExpirado(token) {
  const payload = decodificarPayload(token);
  if (!payload?.exp) return true;
  return payload.exp * 1000 <= Date.now();
}

/** Milisegundos que faltan para que expire (0 si ya expiró o no hay exp). */
export function msHastaExpirar(token) {
  const payload = decodificarPayload(token);
  if (!payload?.exp) return 0;
  return Math.max(0, payload.exp * 1000 - Date.now());
}
