/**
 * layouts/navegacion.js
 * -----------------------------------------
 * Ítems del menú lateral. `roles: null` => visible para todo el staff
 * (administrador y vendedor). `roles: ['administrador']` => solo admin
 * (el backend devuelve 403 a un vendedor en esos módulos, incluso en
 * lectura).
 *
 * `fase` es solo informativo mientras el panel se construye por fases.
 */
export const NAVEGACION = [
  { ruta: '/', etiqueta: 'Dashboard', icono: '📊', roles: null, exacto: true, fase: 2 },
  { ruta: '/clientes', etiqueta: 'Clientes', icono: '👥', roles: null, fase: 3 },
  { ruta: '/pedidos', etiqueta: 'Pedidos', icono: '🧾', roles: null, fase: 4 },
  { ruta: '/pagos-por-revisar', etiqueta: 'Pagos por revisar', icono: '💳', roles: null, fase: 5 },
  { ruta: '/servicios', etiqueta: 'Servicios y Planes', icono: '📦', roles: ['administrador'], fase: 6 },
  { ruta: '/usuarios', etiqueta: 'Vendedores', icono: '🧑‍💼', roles: ['administrador'], fase: 7 },
  { ruta: '/auditoria', etiqueta: 'Auditoría', icono: '📜', roles: ['administrador'], fase: 8 },
  { ruta: '/configuracion', etiqueta: 'Configuración', icono: '⚙️', roles: ['administrador'], fase: 9 },
];
