/**
 * utils/whatsapp.js
 * -----------------------------------------
 * ESPEJO de mateo633-backend/src/utils/whatsapp.js: formato único
 * "+<dígitos>"; un número peruano de 9 dígitos que empieza en 9 se
 * completa con 51. El backend sigue siendo la autoridad (normaliza al
 * guardar); aquí solo se usa para la vista previa del formulario y
 * para armar el enlace wa.me.
 */

/** "+51987654321" o null si no alcanza para ser un número. */
export function normalizarWhatsapp(valor) {
  let digitos = String(valor ?? '').replace(/\D/g, '');
  if (/^9\d{8}$/.test(digitos)) digitos = `51${digitos}`;
  if (digitos.length < 8 || digitos.length > 15) return null;
  return `+${digitos}`;
}

/** Para mostrar: "+51 987 654 321" (Perú) o el número normalizado tal cual. */
export function whatsappVisible(valor) {
  const n = normalizarWhatsapp(valor);
  if (!n) return valor ? String(valor).trim() : '—';
  const m = /^\+51(\d{3})(\d{3})(\d{3})$/.exec(n);
  return m ? `+51 ${m[1]} ${m[2]} ${m[3]}` : n;
}

/** Enlace para abrir el chat (con mensaje opcional). null si el número no sirve. */
export function enlaceWhatsApp(valor, texto) {
  const n = normalizarWhatsapp(valor);
  if (!n) return null;
  return `https://wa.me/${n.slice(1)}${texto ? `?text=${encodeURIComponent(texto)}` : ''}`;
}
