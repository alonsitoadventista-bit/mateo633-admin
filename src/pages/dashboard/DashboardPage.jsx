/**
 * pages/dashboard/DashboardPage.jsx  (Fase 2)
 * -----------------------------------------
 * Resumen operativo. Cada sección carga por separado (un endpoint
 * independiente por panel) para que un fallo o una consulta lenta no
 * bloquee el resto del dashboard.
 *
 * Decisiones V1:
 *  - "Ventas por vendedor" solo para el rol 'administrador'.
 *  - Sin auto-refresco: botón manual "Actualizar" (bump de `recargar`,
 *    que está en las deps del useApi de cada panel).
 *  - "Más vendidos" con límite fijo (10).
 *  - Sin gráfico de tendencia en V1.
 */
import { useState } from 'react';
import { useAuth } from '../../auth/useAuth';
import { Boton } from '../../components/ui';
import { FilaMetricas } from './FilaMetricas.jsx';
import { PanelPagosPorRevisar } from './PanelPagosPorRevisar.jsx';
import { PanelServiciosVencidos } from './PanelServiciosVencidos.jsx';
import { PanelMasVendidos } from './PanelMasVendidos.jsx';
import { PanelVentasPorVendedor } from './PanelVentasPorVendedor.jsx';

export function DashboardPage() {
  const { tienePermiso } = useAuth();
  const [recargar, setRecargar] = useState(0);
  const esAdmin = tienePermiso(['administrador']);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">Resumen operativo del negocio</p>
        </div>
        <Boton variante="secundario" tamano="sm" onClick={() => setRecargar((n) => n + 1)}>
          Actualizar
        </Boton>
      </div>

      <FilaMetricas recargar={recargar} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PanelPagosPorRevisar recargar={recargar} />
        <PanelServiciosVencidos recargar={recargar} />
      </div>

      <PanelMasVendidos recargar={recargar} />

      {esAdmin && <PanelVentasPorVendedor recargar={recargar} />}
    </div>
  );
}
