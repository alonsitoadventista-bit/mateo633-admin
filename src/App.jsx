/**
 * App.jsx
 * -----------------------------------------
 * Mapa de rutas del panel. Todo lo que no sea /login vive bajo
 * DashboardLayout y exige sesión. Los módulos SoloAdmin llevan una
 * guarda extra por rol (el backend igual responde 403).
 */
import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './auth/ProtectedRoute.jsx';
import { DashboardLayout } from './layouts/DashboardLayout.jsx';

import { LoginPage } from './pages/login/LoginPage.jsx';
import { DashboardPage } from './pages/dashboard/DashboardPage.jsx';
import { ClientesPage } from './pages/clientes/ClientesPage.jsx';
import { PedidosPage } from './pages/pedidos/PedidosPage.jsx';
import { PagosPorRevisarPage } from './pages/pagos-por-revisar/PagosPorRevisarPage.jsx';
import { InventarioPage } from './pages/inventario/InventarioPage.jsx';
import { ProveedoresPage } from './pages/proveedores/ProveedoresPage.jsx';
import { ServiciosPage } from './pages/servicios/ServiciosPage.jsx';
import { UsuariosPage } from './pages/usuarios/UsuariosPage.jsx';
import { AuditoriaPage } from './pages/auditoria/AuditoriaPage.jsx';
import { ConfiguracionPage } from './pages/configuracion/ConfiguracionPage.jsx';
import { NotFoundPage } from './pages/NotFoundPage.jsx';

const SOLO_ADMIN = ['administrador'];

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="clientes/*" element={<ClientesPage />} />
        <Route path="pedidos/*" element={<PedidosPage />} />
        <Route path="pagos-por-revisar/*" element={<PagosPorRevisarPage />} />
        <Route path="inventario/*" element={<InventarioPage />} />

        <Route
          path="proveedores/*"
          element={
            <ProtectedRoute roles={SOLO_ADMIN}>
              <ProveedoresPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="servicios/*"
          element={
            <ProtectedRoute roles={SOLO_ADMIN}>
              <ServiciosPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="usuarios/*"
          element={
            <ProtectedRoute roles={SOLO_ADMIN}>
              <UsuariosPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="auditoria/*"
          element={
            <ProtectedRoute roles={SOLO_ADMIN}>
              <AuditoriaPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="configuracion/*"
          element={
            <ProtectedRoute roles={SOLO_ADMIN}>
              <ConfiguracionPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
