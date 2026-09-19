/**
 * pages/inventario/InventarioPage.jsx
 * -----------------------------------------
 * Punto de entrada del módulo, montado en App.jsx bajo "inventario/*".
 * Fase 1: solo una pantalla (lista + alta), sin detalle por id --
 * mismo patrón que Auditoría/Configuración.
 */
import { Route, Routes } from 'react-router-dom';
import { ListaInventario } from './ListaInventario.jsx';
import { NotFoundPage } from '../NotFoundPage.jsx';

export function InventarioPage() {
  return (
    <Routes>
      <Route index element={<ListaInventario />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
