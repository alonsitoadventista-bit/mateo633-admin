/**
 * layouts/IconoNav.jsx
 * -----------------------------------------
 * Set de iconos de línea (SVG inline, sin dependencia nueva) para el
 * menú lateral. Usan `currentColor`, así heredan el color de texto del
 * NavLink (dorado si está activo, gris suave si no) -- los emoji que
 * se usaban antes no se pueden teñir de dorado con CSS.
 */
const PATHS = {
  dashboard: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </>
  ),
  clientes: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 20c0-3.31 2.46-6 5.5-6s5.5 2.69 5.5 6" />
      <circle cx="17" cy="7.5" r="2.3" />
      <path d="M15.8 12.2c2.36.36 4.2 2.53 4.2 5.3" />
    </>
  ),
  pedidos: (
    <>
      <path d="M6 3.5h9l3 3V19a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19V3.5Z" />
      <path d="M15 3.5V7h3.5" />
      <path d="M9 11h6M9 14.5h6M9 8h3" />
    </>
  ),
  pagos: (
    <>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10h18" />
      <path d="M7 14.5h4" />
    </>
  ),
  servicios: (
    <>
      <path d="M12 3.5 4 7.5v9l8 4 8-4v-9L12 3.5Z" />
      <path d="M4 7.5 12 11.5l8-4" />
      <path d="M12 11.5V20" />
    </>
  ),
  inventario: (
    <>
      <rect x="3.5" y="7.5" width="17" height="13" rx="1.5" />
      <path d="M3.5 7.5 7 3.5h10l3.5 4" />
      <path d="M9.5 11.5h5" />
    </>
  ),
  proveedores: (
    <>
      <path d="M3.5 7.5h11v9h-11z" />
      <path d="M14.5 10.5h3.2l2.8 2.8v3.2h-6z" />
      <circle cx="7.5" cy="18.5" r="1.8" />
      <circle cx="16.5" cy="18.5" r="1.8" />
    </>
  ),
  vendedores: (
    <>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5.5 20c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5" />
      <path d="M9.5 5.2 12 3.5l2.5 1.7" />
    </>
  ),
  precios: (
    <>
      <path d="M3.5 12.2V4.5a1 1 0 0 1 1-1h7.7l8.3 8.3a1.5 1.5 0 0 1 0 2.1l-6.1 6.1a1.5 1.5 0 0 1-2.1 0L3.5 12.2Z" />
      <circle cx="8" cy="8" r="1.6" />
    </>
  ),
  auditoria: (
    <>
      <path d="M6 3.5h9l3 3V19a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19V3.5Z" />
      <path d="M9 9.5l1.6 1.6L14.5 7.5" />
      <path d="M9 15h6" />
    </>
  ),
  configuracion: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2.2M12 18.3v2.2M20.5 12h-2.2M5.7 12H3.5M17.7 6.3l-1.55 1.55M7.85 16.15 6.3 17.7M17.7 17.7l-1.55-1.55M7.85 7.85 6.3 6.3" />
    </>
  ),
  // --- Íconos del Dashboard (fase visual 2026-09-24), mismo trazo de línea ---
  billetera: (
    <>
      <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H17v2.5" />
      <rect x="4" y="7.5" width="16.5" height="11.5" rx="2" />
      <path d="M16 13.25h1.5" />
    </>
  ),
  usuarios: (
    <>
      <circle cx="9" cy="8.5" r="3" />
      <path d="M3.5 19.5c.4-3 2.7-5 5.5-5s5.1 2 5.5 5" />
      <circle cx="16.5" cy="8" r="2.4" />
      <path d="M15.5 13.6c2.5.2 4.5 2.1 5 5" />
    </>
  ),
  portapapeles: (
    <>
      <rect x="5" y="4.5" width="14" height="16" rx="2" />
      <path d="M9 4.5V3.5h6v1M9 4.5a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1" />
      <path d="M8.5 10.5h7M8.5 14h7M8.5 17.5h4" />
    </>
  ),
  reloj: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  campana: (
    <>
      <path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15L6 16.5Z" />
      <path d="M10 20.5a2 2 0 0 0 4 0" />
    </>
  ),
  carrito: (
    <>
      <path d="M3 4h2.2l2.3 11h10.2l2-8H7" />
      <circle cx="9" cy="19" r="1.5" />
      <circle cx="17" cy="19" r="1.5" />
    </>
  ),
  grafico: (
    <>
      <path d="M4 20h16" />
      <path d="M6.5 20v-6M11 20V9M15.5 20v-8M20 20V5" />
    </>
  ),
  fuego: (
    <path d="M12 21c-3.6 0-6.5-2.6-6.5-6.2 0-3.3 2.3-5.3 3.6-7.8.3 1.7 1.2 2.9 2.4 3.4-.2-3 .9-5.8 3.5-7.4-.2 2.6.9 4.3 2.2 6 1 1.4 1.3 2.7 1.3 4.3 0 4.6-2.9 7.7-6.5 7.7Z" />
  ),
  basedatos: (
    <>
      <ellipse cx="12" cy="6" rx="7" ry="2.5" />
      <path d="M5 6v6c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6" />
      <path d="M5 12v6c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-6" />
    </>
  ),
  calendario: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" />
      <path d="M8 13.5h2M14 13.5h2M8 17h2" />
    </>
  ),
  tendencia: (
    <>
      <path d="M3.5 17 9.5 11l4 4 7-7.5" />
      <path d="M15.5 7.5h5v5" />
    </>
  ),
  alerta: (
    <>
      <path d="M12 4 21 19.5H3L12 4Z" />
      <path d="M12 10v4.5M12 17.2v.1" />
    </>
  ),
  critico: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v5.5M12 16.2v.1" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5.5M12 7.8v.1" />
    </>
  ),
  check: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.5 12.3 2.3 2.3 4.7-4.9" />
    </>
  ),
  whatsapp: (
    <>
      <path d="M4.5 19.5 5.6 16A8 8 0 1 1 8.4 18.6l-3.9.9Z" />
      <path d="M9.3 8.8c.3-.6.8-.6 1.1 0l.6 1.3c.1.3 0 .6-.2.8l-.5.5c.5 1.1 1.4 2 2.5 2.5l.5-.5c.2-.2.5-.3.8-.2l1.3.6c.6.3.6.8 0 1.1-.7.5-1.6.7-2.4.4-2-.8-3.5-2.3-4.3-4.3-.3-.8-.1-1.7.6-2.2Z" />
    </>
  ),
  corona: <path d="M3.5 8.5 7 11l5-6 5 6 3.5-2.5L19 18H5L3.5 8.5Z" />,
  flecha: <path d="m9.5 6 6 6-6 6" />,
  actualizar: (
    <>
      <path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3" />
      <path d="M19.5 4.5v4h-4" />
    </>
  ),
};

export function IconoNav({ nombre, className = 'h-5 w-5' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {PATHS[nombre] || PATHS.dashboard}
    </svg>
  );
}
