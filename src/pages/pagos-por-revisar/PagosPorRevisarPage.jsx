/**
 * pages/pagos-por-revisar/PagosPorRevisarPage.jsx  (Fase 5)
 * -----------------------------------------
 * Punto de entrada del módulo, montado en App.jsx bajo "pagos-por-revisar/*".
 * Rutas anidadas: lista (índice) y detalle por pedidoId. Mismo patrón
 * que ClientesPage.jsx (Fase 3) y PedidosPage.jsx (Fase 4).
 */
import { Route, Routes } from 'react-router-dom';
import { ListaPagosPorRevisar } from './ListaPagosPorRevisar.jsx';
import { DetallePagoPorRevisar } from './DetallePagoPorRevisar.jsx';
import { NotFoundPage } from '../NotFoundPage.jsx';

export function PagosPorRevisarPage() {
  return (
    <Routes>
      <Route index element={<ListaPagosPorRevisar />} />
      <Route path=":pedidoId" element={<DetallePagoPorRevisar />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
