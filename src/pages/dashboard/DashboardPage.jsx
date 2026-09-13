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
import { PanelMasVendidos } from './PanelMasVendidos.jsx';
import { PanelPedidosRecientes } from './PanelPedidosRecientes.jsx';
import { PanelModulos } from './PanelModulos.jsx';
import { PanelPagosPorRevisar } from './PanelPagosPorRevisar.jsx';
import { PanelServiciosVencidos } from './PanelServiciosVencidos.jsx';
import { PanelVentasPorVendedor } from './PanelVentasPorVendedor.jsx';

const FECHA_HOY = new Intl.DateTimeFormat('es-PE', {
  weekday: 'long',
  day: '2-digit',
  month: 'long',
  year: 'numeric',
}).format(new Date());

export function DashboardPage() {
  const { admin, tienePermiso } = useAuth();
  const [recargar, setRecargar] = useState(0);
  const esAdmin = tienePermiso(['administrador']);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-texto">
            Hola, <span className="text-marca-500">{admin?.nombre}</span>
          </h1>
          <p className="text-sm text-texto-suave">Bienvenido al panel de Mateo 6:33 Premium</p>
        </div>
        <div className="flex items-center gap-3">
          <p className="hidden text-xs capitalize text-texto-suave sm:block">{FECHA_HOY}</p>
          <Boton variante="secundario" tamano="sm" onClick={() => setRecargar((n) => n + 1)}>
            Actualizar
          </Boton>
        </div>
      </div>

      <FilaMetricas recargar={recargar} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PanelMasVendidos recargar={recargar} />
        <PanelPedidosRecientes recargar={recargar} />
      </div>

      <PanelModulos />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PanelPagosPorRevisar recargar={recargar} />
        <PanelServiciosVencidos recargar={recargar} />
      </div>

      {esAdmin && <PanelVentasPorVendedor recargar={recargar} />}
    </div>
  );
}
