/**
 * pages/dashboard/DashboardPage.jsx  (Dashboard nuevo, 2026-09-24 -- fase funcional)
 * -----------------------------------------
 * Panel de control del negocio, con la estructura de la referencia
 * Downloads/referencias/mateo633_home_premium_reference.jpg:
 *   1. Tarjetas: ventas del día, servicios activos, pedidos pendientes, cuentas por vencer.
 *   2. Ganancias (SOLO administrador) + gráfico de ventas.
 *   3. Estado del inventario + últimos pedidos.
 *   4. Alertas operativas + servicios más vendidos.
 *   5. Ventas por vendedor (SOLO administrador).
 * Cada sección carga su propio endpoint: si una falla o tarda, no bloquea
 * al resto. Todas las fechas las calcula el backend en hora de Lima.
 * Sin auto-refresco: botón "Actualizar" (bump de `recargar`).
 *
 * Reemplaza a FilaMetricas, PanelModulos, PanelPedidosRecientes,
 * PanelPagosPorRevisar y PanelServiciosVencidos (quedan en el repo sin uso
 * hasta que el usuario autorice borrarlos). La fase visual final viene después.
 */
import { useEffect, useState } from 'react';
import { useAuth } from '../../auth/useAuth';
import { Boton } from '../../components/ui';
import { capitalizar } from '../../utils/formato';
import { TarjetasResumen } from './TarjetasResumen.jsx';
import { PanelGanancias } from './PanelGanancias.jsx';
import { GraficoVentas } from './GraficoVentas.jsx';
import { PanelInventario } from './PanelInventario.jsx';
import { PanelUltimosPedidos } from './PanelUltimosPedidos.jsx';
import { PanelAlertas } from './PanelAlertas.jsx';
import { PanelMasVendidos } from './PanelMasVendidos.jsx';
import { PanelVentasPorVendedor } from './PanelVentasPorVendedor.jsx';

const FORMATO_FECHA = new Intl.DateTimeFormat('es-PE', {
  weekday: 'long',
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/Lima',
});

/** Fecha y hora de Lima; se actualiza cada minuto (antes quedaba congelada al cargar el módulo). */
function useFechaActual() {
  const [ahora, setAhora] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setAhora(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  return capitalizar(FORMATO_FECHA.format(ahora));
}

export function DashboardPage() {
  const { admin, tienePermiso } = useAuth();
  const [recargar, setRecargar] = useState(0);
  const esAdmin = tienePermiso(['administrador']);
  const fechaActual = useFechaActual();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-texto">Dashboard</h1>
          <p className="text-sm text-texto-suave">
            Resumen general del negocio · Hola, <span className="text-marca-500">{admin?.nombre}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <p className="hidden text-xs text-texto-suave sm:block">{fechaActual}</p>
          <Boton variante="secundario" tamano="sm" onClick={() => setRecargar((n) => n + 1)}>
            Actualizar
          </Boton>
        </div>
      </div>

      <TarjetasResumen recargar={recargar} />

      <div className={`grid grid-cols-1 gap-4 ${esAdmin ? 'xl:grid-cols-2' : ''}`}>
        {esAdmin && <PanelGanancias recargar={recargar} />}
        <GraficoVentas recargar={recargar} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <PanelInventario recargar={recargar} />
        <PanelUltimosPedidos recargar={recargar} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <PanelAlertas recargar={recargar} />
        <PanelMasVendidos recargar={recargar} />
      </div>

      {esAdmin && <PanelVentasPorVendedor recargar={recargar} />}
    </div>
  );
}
