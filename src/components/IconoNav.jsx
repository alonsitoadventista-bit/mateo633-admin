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
