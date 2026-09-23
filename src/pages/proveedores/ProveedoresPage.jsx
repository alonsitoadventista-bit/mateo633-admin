/**
 * pages/proveedores/ProveedoresPage.jsx
 * -----------------------------------------
 * Punto de entrada del módulo, montado en App.jsx bajo "proveedores/*".
 * Una sola pantalla (lista + alta + activar/desactivar), sin detalle
 * por id -- mismo patrón que Inventario/Auditoría/Configuración.
 */
import { Route, Routes } from 'react-router-dom';
import { ListaProveedores } from './ListaProveedores.jsx';
import { NotFoundPage } from '../NotFoundPage.jsx';

export function ProveedoresPage() {
  return (
    <Routes>
      <Route index element={<ListaProveedores />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
