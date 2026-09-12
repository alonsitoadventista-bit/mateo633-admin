/**
 * layouts/DashboardLayout.jsx
 * -----------------------------------------
 * Marco del panel: barra lateral (filtrada por rol) + barra superior
 * + <Outlet/> para el módulo activo. Responsive: la lateral se colapsa
 * bajo el breakpoint md y se abre con el botón ☰.
 */
import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { NAVEGACION } from './navegacion';
import { EstadoBackend } from './EstadoBackend.jsx';
import { NOMBRE_APP } from '../config';

export function DashboardLayout() {
  const { admin, cerrarSesion, tienePermiso } = useAuth();
  const [abiertoMovil, setAbiertoMovil] = useState(false);

  const items = NAVEGACION.filter((i) => tienePermiso(i.roles));

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Overlay móvil */}
      {abiertoMovil && (
        <div className="fixed inset-0 z-30 bg-slate-900/30 md:hidden" onClick={() => setAbiertoMovil(false)} />
      )}

      <aside
        className={`fixed z-40 flex h-full w-60 flex-col border-r border-slate-200 bg-white transition-transform
          md:static md:translate-x-0 ${abiertoMovil ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-4">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-marca-700 text-xs font-bold text-white">
            6:33
          </span>
          <span className="text-sm font-semibold text-slate-800">{NOMBRE_APP}</span>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {items.map((item) => (
            <NavLink
              key={item.ruta}
              to={item.ruta}
              end={item.exacto}
              onClick={() => setAbiertoMovil(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                  isActive ? 'bg-marca-50 font-medium text-marca-800' : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              <span aria-hidden>{item.icono}</span>
              {item.etiqueta}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-100 p-3 text-xs text-slate-400">Panel V1.0 · Fase 0</div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
          <button
            className="rounded p-1 text-slate-500 hover:bg-slate-100 md:hidden"
            onClick={() => setAbiertoMovil(true)}
            aria-label="Abrir menú"
          >
            ☰
          </button>

          <EstadoBackend />

          <div className="flex items-center gap-3">
            <div className="text-right leading-tight">
              <p className="text-sm font-medium text-slate-800">{admin?.nombre}</p>
              <p className="text-xs capitalize text-slate-500">{admin?.rol}</p>
            </div>
            <button
              onClick={cerrarSesion}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Cerrar sesión
            </button>
          </div>
        </header>

        <main className="min-w-0 flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
