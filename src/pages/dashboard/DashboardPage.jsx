/**
 * pages/dashboard/DashboardPage.jsx  (Dashboard nuevo, 2026-09-24 -- fase funcional)
 * -----------------------------------------
 * Panel de control del negocio, con la estructura de la referencia
 * Downloads/referencias/mateo633_home_premium_reference.jpg:
 *   1. Tarjetas: ventas del día, servicios activos, pedidos pendientes, cuentas por vencer.
 *   2. Ganancias (SOLO administrador) + gráfico de ventas.
 *   3. Estado del inventario + últimos pedidos.
 *   4. Atención requerida + Próximas renovaciones (2026-09-24: reemplaza a
 *      "Servicios más vendidos", que el usuario pidió quitar del Dashboard).
 *   5. Ventas por vendedor (SOLO administrador).
 * Cada sección carga su propio endpoint: si una falla o tarda, no bloquea
 * al resto. Todas las fechas las calcula el backend en hora de Lima.
 * Sin auto-refresco: botón "Actualizar" (bump de `recargar`).
 *
 * Reemplaza a FilaMetricas, PanelModulos, PanelPedidosRecientes,
 * PanelPagosPorRevisar, PanelServiciosVencidos y PanelMasVendidos (quedan en el repo sin uso
 * hasta que el usuario autorice borrarlos). La fase visual final viene después.
 */
import { useEffect, useState } from 'react';
import { useAuth } from '../../auth/useAuth';
import { IconoNav } from '../../components/IconoNav.jsx';
import { capitalizar } from '../../utils/formato';
import { TarjetasResumen } from './TarjetasResumen.jsx';
import { PanelGanancias } from './PanelGanancias.jsx';
import { GraficoVentas } from './GraficoVentas.jsx';
import { PanelInventario } from './PanelInventario.jsx';
import { PanelUltimosPedidos } from './PanelUltimosPedidos.jsx';
import { PanelAlertas } from './PanelAlertas.jsx';
import { PanelRenovaciones } from './PanelRenovaciones.jsx';
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
    <div className="mx-auto max-w-[1600px] space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-texto">Dashboard</h1>
          <p className="text-sm text-texto-suave">
            Resumen general del negocio · Hola, <span className="font-medium text-marca-400">{admin?.nombre}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2 text-xs text-texto/80 md:flex">
            <IconoNav nombre="calendario" className="h-4 w-4 text-marca-400" />
            {fechaActual}
          </span>
          <button
            onClick={() => setRecargar((n) => n + 1)}
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.04] px-3.5 py-2 text-xs font-semibold text-texto transition hover:border-marca-500/50 hover:text-marca-400"
          >
            <IconoNav nombre="actualizar" className="h-4 w-4" />
            Actualizar
          </button>
        </div>
      </div>

      <TarjetasResumen recargar={recargar} />

      <div className={`grid grid-cols-1 gap-5 ${esAdmin ? 'xl:grid-cols-2' : ''}`}>
        {esAdmin && <PanelGanancias recargar={recargar} />}
        <GraficoVentas recargar={recargar} />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <PanelInventario recargar={recargar} />
        <PanelUltimosPedidos recargar={recargar} />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <PanelAlertas recargar={recargar} />
        <PanelRenovaciones recargar={recargar} />
      </div>

      {esAdmin && <PanelVentasPorVendedor recargar={recargar} />}
    </div>
  );
}
