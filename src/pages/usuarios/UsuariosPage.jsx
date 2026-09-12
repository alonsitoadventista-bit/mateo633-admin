/**
 * pages/usuarios/UsuariosPage.jsx  (Fase 7 — "Vendedores" en el menú)
 * -----------------------------------------
 * Punto de entrada del módulo, montado en App.jsx bajo "usuarios/*"
 * (ya protegido con ProtectedRoute roles={SOLO_ADMIN}). Rutas
 * anidadas: lista (índice) y detalle por id. Mismo patrón que
 * ClientesPage.jsx (Fase 3), PedidosPage.jsx (Fase 4),
 * PagosPorRevisarPage.jsx (Fase 5) y ServiciosPage.jsx (Fase 6).
 */
import { Route, Routes } from 'react-router-dom';
import { ListaUsuarios } from './ListaUsuarios.jsx';
import { DetalleUsuario } from './DetalleUsuario.jsx';
import { NotFoundPage } from '../NotFoundPage.jsx';

export function UsuariosPage() {
  return (
    <Routes>
      <Route index element={<ListaUsuarios />} />
      <Route path=":id" element={<DetalleUsuario />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
