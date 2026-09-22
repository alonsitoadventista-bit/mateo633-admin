/**
 * utils/formato.js
 * -----------------------------------------
 * Formateo para mostrar. El negocio opera en Perú, moneda soles (PEN).
 * Más adelante el módulo Configuración podrá sobrescribir estos valores
 * (la tabla `configuracion` en el backend todavía tiene una clave
 * `moneda` sin conectar a este archivo).
 */

const MONEDA_POR_DEFECTO = 'PEN';
const LOCALE = 'es-PE';

export function moneda(valor, codigo = MONEDA_POR_DEFECTO) {
  const n = Number(valor);
  if (!Number.isFinite(n)) return '—';
  try {
    return new Intl.NumberFormat(LOCALE, { style: 'currency', currency: codigo }).format(n);
  } catch {
    return `${n.toFixed(2)} ${codigo}`;
  }
}

/** Entero con separador de miles: 1234 -> "1,234". */
export function numero(valor) {
  const n = Number(valor);
  if (!Number.isFinite(n)) return '—';
  return new Intl.NumberFormat(LOCALE).format(n);
}

export function fecha(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat(LOCALE, { day: '2-digit', month: 'short', year: 'numeric' }).format(d);
}

export function fechaHora(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat(LOCALE, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/** Días entre hoy y una fecha (negativo = ya pasó). */
export function diasHasta(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return Math.ceil((d.getTime() - Date.now()) / 86_400_000);
}

/** Normaliza un número de WhatsApp a formato visible (+52 55 1234 5678 -> tal cual, sin espacios raros). */
export function whatsapp(valor) {
  if (!valor) return '—';
  return String(valor).trim();
}

/** 'estado_cliente_cambiado' -> 'Estado cliente cambiado' */
export function humanizar(texto) {
  if (!texto) return '';
  const s = String(texto).replace(/_/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
}
