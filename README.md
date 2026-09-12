# Mateo 6:33 Premium — Panel de administración (`mateo633-admin`)

Frontend del panel web. Consume la API de [`mateo633-backend`](../mateo633-backend).
React 18 + Vite + React Router 6 + Tailwind CSS v4 (CSS-first).

> **Estado: Fase 0 (scaffold).** La estructura, la capa de API, la
> autenticación y el marco visual están listos. Los módulos se
> construyen por fases (ver más abajo). Cada módulo hoy es un
> *placeholder* que documenta en pantalla los endpoints que usará.

## Requisitos

- Node 18+ (probado con Node 24)
- El backend corriendo (por defecto en `http://localhost:3000`)

## Puesta en marcha

```bash
npm install
cp .env.example .env     # dejar VITE_API_URL vacío en desarrollo
npm run dev              # http://localhost:5173
```

En desarrollo, `vite.config.js` hace de proxy: `/admin`, `/uploads` y
`/health` se reenvían al backend, así no hay problemas de CORS.

Para producción:

```bash
echo "VITE_API_URL=https://tu-backend-desplegado.com" > .env
npm run build           # genera dist/
npm run preview
```

`dist/` es estático; se despliega en cualquier hosting (Vercel,
Netlify, Railway static…). Recordá añadir el origen del panel a
`ALLOWED_ORIGINS` en el `.env` del backend.

## Estructura

```
src/
├── api/            Un archivo por recurso. Único punto que habla con el backend.
│   ├── client.js       fetch + Bearer + manejo de 401 + normalización de errores
│   ├── auth.js         POST /admin/login
│   ├── dashboard.js    /admin/dashboard/* (incluye la lista de "pagos por revisar")
│   ├── clientes.js  servicios.js  pedidos.js  pagosPorRevisar.js
│   ├── usuarios.js  auditoria.js (+ exportarCsv)  configuracion.js
├── auth/
│   ├── sesion.js       almacén de sesión sin React (lo lee api/client.js)
│   ├── AuthContext.jsx sesión, login/logout, expiración automática del token (8h)
│   ├── useAuth.js       hook de acceso
│   └── ProtectedRoute.jsx  guarda por sesión y por rol
├── layouts/
│   ├── DashboardLayout.jsx  sidebar (filtrada por rol) + topbar + <Outlet/>
│   ├── navegacion.js         ítems del menú con su rol requerido
│   └── EstadoBackend.jsx     indicador de /health en la topbar
├── components/
│   ├── ui/             Boton, Campo, Selector, Tarjeta, Etiqueta, Modal, Tabla,
│   │                   DialogoConfirmacion, EstadoCarga/Error/Vacio
│   └── PlaceholderModulo.jsx
├── hooks/useApi.js     carga genérica: { data, cargando, error, refetch }
├── utils/
│   ├── jwt.js               decodifica el JWT SOLO para UI
│   ├── formato.js           moneda / fechas / whatsapp
│   ├── constantes.js        ESPEJO de backend/src/utils/constants.js
│   └── configuracionClaves.js  las 14 claves editables (migración 012)
└── pages/             Un módulo por carpeta
```

## Mapa de permisos (del backend)

| Módulo | administrador | vendedor |
|---|---|---|
| Dashboard, Clientes, Pedidos, Pagos por revisar | ✅ | ✅ |
| Servicios y Planes, Vendedores, Auditoría, Configuración | ✅ | ❌ 403 (incluida la lectura) |

El frontend solo oculta lo que el rol no puede usar. La autoridad real
es el backend: `middleware/auth.middleware.js` responde 401/403 aunque
se manipule el panel.

## Fases de construcción

| Fase | Módulo |
|---|---|
| **0** | Scaffold (este commit): estructura, `api/`, auth, layout, kit UI |
| 1 | Login + sesión + expiración |
| 2 | Dashboard (5 tarjetas) |
| 3 | Clientes |
| 4 | Pedidos (máquina de estados) |
| 5 | Pagos por revisar |
| 6 | Servicios y Planes *(SoloAdmin)* |
| 7 | Vendedores / Usuarios *(SoloAdmin)* |
| 8 | Auditoría *(SoloAdmin)* |
| 9 | Configuración *(SoloAdmin)* |

## Notas de integración (verificadas contra el backend)

- **Errores**: el backend responde siempre `{ "error": "..." }`. `api/client.js`
  lo convierte en `throw new ErrorApi(mensaje, status)`.
- **401** en cualquier endpoint ⇒ se borra la sesión y se vuelve al login.
- **Sesión de 8h sin refresh token**: al expirar, cierre automático.
- **Archivos** (`imagen_url`, `comprobante_url`): llegan como rutas
  relativas `/uploads/...`. Usar `urlArchivo()` de `api/client.js` para
  construir el `src`. También pueden ser URLs externas.
- **"Pagos por revisar"**: la *lista* está en `/admin/dashboard/pagos-por-revisar`;
  las *acciones* en `/admin/pagos-por-revisar/:pedidoId/(aprobar|rechazar)`.
- **Sin paginación** salvo Auditoría → filtrar/paginar en cliente por ahora.
- **Tickets de soporte**: el backend solo tiene endpoints de cliente; no
  hay módulo de panel en V1 (roadmap).
```
