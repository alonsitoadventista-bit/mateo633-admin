/**
 * pages/dashboard/PanelModulos.jsx  (rediseño visual, sin lógica nueva)
 * -----------------------------------------
 * Grilla de accesos directos a cada módulo, reutilizando las mismas
 * rutas/roles ya definidos en layouts/navegacion.js (ningún módulo,
 * ruta o permiso nuevo). "Activo" es honesto: las 9 fases del panel
 * ya están implementadas y funcionando, no es un dato inventado.
 */
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import { NAVEGACION } from '../../layouts/navegacion';
import { IconoNav } from '../../components/IconoNav.jsx';

const DESCRIPCION = {
  '/': 'Resumen y métricas',
  '/clientes': 'Gestión de clientes y estados',
  '/pedidos': 'Activación, renovaciones y cancelaciones',
  '/pagos-por-revisar': 'Aprobación, rechazo y reporte',
  '/servicios': 'Catálogo y precios',
  '/usuarios': 'Usuarios y roles',
  '/auditoria': 'Registro de acciones y filtros',
  '/configuracion': 'Parámetros del sistema',
};

export function PanelModulos() {
  const { tienePermiso } = useAuth();
  const items = NAVEGACION.filter((i) => tienePermiso(i.roles));

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-texto">Módulos del sistema</h2>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-marca-500">
          Gestión simple, resultados reales
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
        {items.map((item) => (
          <Link
            key={item.ruta}
            to={item.ruta}
            className="group flex flex-col items-center gap-2 rounded-2xl border border-borde bg-superficie p-4 text-center shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:border-marca-500/40"
          >
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-marca-500/12 text-marca-400 transition group-hover:bg-marca-500/20">
              <IconoNav nombre={item.icono} className="h-5 w-5" />
            </span>
            <p className="text-xs font-semibold text-texto">{item.etiqueta}</p>
            <p className="text-[11px] leading-tight text-texto-suave">{DESCRIPCION[item.ruta]}</p>
            <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-green-400">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
              Activo
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
