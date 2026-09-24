import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/**
 * En desarrollo, el panel corre en :5173 y el backend en :3000.
 * El proxy evita CORS localmente: todo lo que empiece por /admin,
 * /uploads o /health se reenvía al backend. Las rutas propias del
 * panel (/, /clientes, /pedidos, ...) NO llevan esos prefijos, así
 * que nunca chocan con el proxy.
 *
 * En producción se ignora este proxy: se define VITE_API_URL con la
 * URL pública del backend (ver .env.example) y el panel llama directo.
 */
const DESTINO_BACKEND = process.env.VITE_DEV_BACKEND || 'http://localhost:3000';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/admin': DESTINO_BACKEND,
      '/uploads': DESTINO_BACKEND,
      '/health': DESTINO_BACKEND,
      // Solo la ruta pública de soporte: '/configuracion' a secas es una página del panel.
      '/configuracion/soporte': DESTINO_BACKEND,
    },
  },
});
