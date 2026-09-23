/**
 * pages/inventario/InventarioPage.jsx
 * -----------------------------------------
 * Punto de entrada del módulo, montado en App.jsx bajo "inventario/*".
 * Fase 1: lista + alta. Fase 3A: vista Cuenta (grilla de perfiles,
 * PIN e historial) en "cuentas/:cuentaId".
 */
import { Route, Routes } from 'react-router-dom';
import { ListaInventario } from './ListaInventario.jsx';
import { DetalleCuenta } from './DetalleCuenta.jsx';
import { NotFoundPage } from '../NotFoundPage.jsx';

export function InventarioPage() {
  return (
    <Routes>
      <Route index element={<ListaInventario />} />
      <Route path="cuentas/:cuentaId" element={<DetalleCuenta />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
