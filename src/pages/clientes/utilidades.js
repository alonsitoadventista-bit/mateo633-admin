/**
 * pages/clientes/utilidades.js  (Clientes CRM, F2 visual)
 * -----------------------------------------
 * Ayudas de presentación del módulo Clientes: iniciales y color del avatar,
 * fechas relativas, urgencia del vencimiento y color de marca del servicio.
 * Solo presentación: ningún dato se calcula aquí que no venga del backend.
 */

const COLORES_AVATAR = [
  'from-amber-400 to-orange-600',
  'from-sky-400 to-blue-600',
  'from-emerald-400 to-teal-600',
  'from-violet-400 to-purple-600',
  'from-rose-400 to-pink-600',
  'from-lime-400 to-green-600',
  'from-cyan-400 to-sky-600',
  'from-fuchsia-400 to-violet-600',
];

/** "María Quispe Flores" → "MQ". */
export function iniciales(nombre) {
  const partes = String(nombre || '?').trim().split(/\s+/);
  return ((partes[0]?.[0] || '') + (partes[1]?.[0] || '')).toUpperCase() || '?';
}

/** Mismo nombre → mismo color, siempre. */
export function colorAvatar(nombre) {
  let h = 0;
  for (const c of String(nombre || '')) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return COLORES_AVATAR[h % COLORES_AVATAR.length];
}

/** "hoy", "ayer", "hace 5 días", "hace 2 meses", "hace 1 año". */
export function fechaRelativa(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const inicio = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const dias = Math.round((inicio(new Date()) - inicio(d)) / 86_400_000);
  if (dias <= 0) return 'hoy';
  if (dias === 1) return 'ayer';
  if (dias < 30) return `hace ${dias} días`;
  const meses = Math.floor(dias / 30);
  if (meses < 12) return `hace ${meses} ${meses === 1 ? 'mes' : 'meses'}`;
  const anios = Math.floor(meses / 12);
  return `hace ${anios} ${anios === 1 ? 'año' : 'años'}`;
}

/**
 * Pastilla de urgencia del vencimiento a partir de los días restantes
 * (negativo = ya venció). `corto` para tablas, `largo` para la ficha.
 */
export function urgencia(dias) {
  if (dias === null || dias === undefined) return null;
  if (dias < 0) {
    const n = -dias;
    return { corto: `Venció hace ${n} d`, largo: `Venció hace ${n} día${n === 1 ? '' : 's'}`, grande: 'Vencido', clase: 'border-rose-500/50 bg-rose-500/15 text-rose-300', barra: 'bg-rose-500' };
  }
  if (dias === 0) return { corto: 'Vence hoy', largo: 'Vence hoy', grande: 'HOY', clase: 'border-rose-500/50 bg-rose-500/20 text-rose-200', barra: 'bg-rose-500' };
  if (dias === 1) return { corto: 'Mañana', largo: 'Vence mañana', grande: '1 día', clase: 'border-amber-500/50 bg-amber-500/20 text-amber-200', barra: 'bg-amber-400' };
  if (dias <= 3) return { corto: `En ${dias} días`, largo: `Vence en ${dias} días`, grande: `${dias} días`, clase: 'border-amber-500/50 bg-amber-500/20 text-amber-200', barra: 'bg-amber-400' };
  if (dias <= 7) return { corto: `En ${dias} días`, largo: `Vence en ${dias} días`, grande: `${dias} días`, clase: 'border-amber-500/30 bg-amber-500/10 text-amber-300', barra: 'bg-amber-400' };
  return { corto: `En ${dias} días`, largo: `Vence en ${dias} días`, grande: `${dias} días`, clase: 'border-white/10 bg-white/[0.04] text-texto/85', barra: 'bg-emerald-400' };
}

/**
 * Color de acento por servicio para las tarjetas de la ficha. Mismos colores
 * de marca que IconoServicio (pages/dashboard/piezas.jsx), que no se toca.
 */
const ACENTO_MARCA = [
  [/netflix/i, '#e50914'],
  [/disney/i, '#113ccf'],
  [/hbo|max/i, '#5b2ee5'],
  [/prime|amazon/i, '#00a8e1'],
  [/youtube/i, '#ff0000'],
  [/spotify/i, '#1db954'],
  [/paramount/i, '#0064ff'],
  [/crunchyroll/i, '#f47521'],
  [/apple/i, '#e5e7eb'],
  [/canva/i, '#00c4cc'],
  [/vix/i, '#ff5b00'],
];

export function acentoServicio(nombre) {
  return ACENTO_MARCA.find(([re]) => re.test(nombre || ''))?.[1] || '#d4af37';
}
