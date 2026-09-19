/**
 * layouts/navegacion.js
 * -----------------------------------------
 * Ítems del menú lateral. `roles: null` => visible para todo el staff
 * (administrador y vendedor). `roles: ['administrador']` => solo admin
 * (el backend devuelve 403 a un vendedor en esos módulos, incluso en
 * lectura).
 *
 * `icono` es la clave del set de iconos de línea en IconoNav.jsx (antes
 * emoji -- se reemplazaron porque un emoji no se puede teñir de dorado
 * con CSS). Mismas rutas y acciones de siempre, sin cambios.
 *
 * `fase` es solo informativo mientras el panel se construye por fases.
 */
export const NAVEGACION = [
  { ruta: '/', etiqueta: 'Dashboard', icono: 'dashboard', roles: null, exacto: true, fase: 2 },
  { ruta: '/clientes', etiqueta: 'Clientes', icono: 'clientes', roles: null, fase: 3 },
  { ruta: '/pedidos', etiqueta: 'Pedidos', icono: 'pedidos', roles: null, fase: 4 },
  { ruta: '/pagos-por-revisar', etiqueta: 'Pagos por revisar', icono: 'pagos', roles: null, fase: 5 },
  { ruta: '/inventario', etiqueta: 'Inventario', icono: 'inventario', roles: null, fase: 10 },
  { ruta: '/servicios', etiqueta: 'Servicios y Planes', icono: 'servicios', roles: ['administrador'], fase: 6 },
  { ruta: '/usuarios', etiqueta: 'Vendedores', icono: 'vendedores', roles: ['administrador'], fase: 7 },
  { ruta: '/auditoria', etiqueta: 'Auditoría', icono: 'auditoria', roles: ['administrador'], fase: 8 },
  { ruta: '/configuracion', etiqueta: 'Configuración', icono: 'configuracion', roles: ['administrador'], fase: 9 },
];
