/**
 * pages/clientes/ClientesPage.jsx  (Fase 3)
 * -----------------------------------------
 * Punto de entrada del módulo, montado en App.jsx bajo "clientes/*".
 * Rutas anidadas: lista (índice) y detalle por id.
 */
import { Route, Routes } from 'react-router-dom';
import { ListaClientes } from './ListaClientes.jsx';
import { DetalleCliente } from './DetalleCliente.jsx';
import { NotFoundPage } from '../NotFoundPage.jsx';

export function ClientesPage() {
  return (
    <Routes>
      <Route index element={<ListaClientes />} />
      <Route path=":id" element={<DetalleCliente />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
