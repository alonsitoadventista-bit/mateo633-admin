/**
 * pages/servicios/ServiciosPage.jsx  (Fase 6)
 * -----------------------------------------
 * Punto de entrada del módulo, montado en App.jsx bajo "servicios/*"
 * (ya protegido con ProtectedRoute roles={SOLO_ADMIN}). Rutas
 * anidadas: lista (índice) y detalle por id. Mismo patrón que
 * ClientesPage.jsx (Fase 3), PedidosPage.jsx (Fase 4) y
 * PagosPorRevisarPage.jsx (Fase 5).
 */
import { Route, Routes } from 'react-router-dom';
import { ListaServicios } from './ListaServicios.jsx';
import { DetalleServicio } from './DetalleServicio.jsx';
import { NotFoundPage } from '../NotFoundPage.jsx';

export function ServiciosPage() {
  return (
    <Routes>
      <Route index element={<ListaServicios />} />
      <Route path=":id" element={<DetalleServicio />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
