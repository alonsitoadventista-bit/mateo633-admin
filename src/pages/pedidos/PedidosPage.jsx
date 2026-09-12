/**
 * pages/pedidos/PedidosPage.jsx  (Fase 4)
 * -----------------------------------------
 * Punto de entrada del módulo, montado en App.jsx bajo "pedidos/*".
 * Rutas anidadas: lista (índice) y detalle por id. Mismo patrón que
 * ClientesPage.jsx (Fase 3).
 */
import { Route, Routes } from 'react-router-dom';
import { ListaPedidos } from './ListaPedidos.jsx';
import { DetallePedido } from './DetallePedido.jsx';
import { NotFoundPage } from '../NotFoundPage.jsx';

export function PedidosPage() {
  return (
    <Routes>
      <Route index element={<ListaPedidos />} />
      <Route path=":id" element={<DetallePedido />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
