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
import { IconoNav } from '../components/IconoNav.jsx';
import { EstadoBackend } from './EstadoBackend.jsx';
import { NOMBRE_APP } from '../config';

export function DashboardLayout() {
  const { admin, cerrarSesion, tienePermiso } = useAuth();
  const [abiertoMovil, setAbiertoMovil] = useState(false);

  const items = NAVEGACION.filter((i) => tienePermiso(i.roles));

  return (
    <div className="flex min-h-screen bg-fondo">
      {/* Overlay móvil */}
      {abiertoMovil && (
        <div className="fixed inset-0 z-30 bg-black/60 md:hidden" onClick={() => setAbiertoMovil(false)} />
      )}

      <aside
        className={`fixed z-40 flex h-full w-64 flex-col border-r border-borde bg-superficie transition-transform
          md:static md:translate-x-0 ${abiertoMovil ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Logo con presencia visual */}
        <div className="flex flex-col items-center gap-2 border-b border-borde px-5 py-7 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-marca-400 to-marca-700 text-fondo shadow-lg shadow-marca-500/30">
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor">
              <path d="M3 8.5 6.5 11 9.5 5.5 12 10l2.5-4.5L17.5 11 21 8.5 19.5 18h-15L3 8.5Z" />
            </svg>
          </span>
          <div>
            <p className="text-base font-bold leading-tight text-texto">Mateo 6:33</p>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-marca-500">Premium</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {items.map((item) => (
            <NavLink
              key={item.ruta}
              to={item.ruta}
              end={item.exacto}
              onClick={() => setAbiertoMovil(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-marca-500 font-semibold text-fondo shadow-lg shadow-marca-500/25'
                    : 'text-texto-suave hover:translate-x-0.5 hover:bg-superficie-alta hover:text-texto'
                }`
              }
            >
              <IconoNav nombre={item.icono} className="h-5 w-5 shrink-0" />
              <span className="truncate">{item.etiqueta}</span>
            </NavLink>
          ))}
        </nav>

        <div className="relative overflow-hidden border-t border-borde p-4">
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: 'radial-gradient(120px circle at 50% 100%, rgba(212,175,55,0.12), transparent 70%)' }}
          />
          <p className="relative text-center font-serif text-sm italic text-marca-400/90">
            Tu entretenimiento sin límites
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-borde bg-superficie/80 px-4 py-3 backdrop-blur">
          <button
            className="rounded-lg p-1.5 text-texto-suave hover:bg-superficie-alta hover:text-texto md:hidden"
            onClick={() => setAbiertoMovil(true)}
            aria-label="Abrir menú"
          >
            ☰
          </button>

          <EstadoBackend />

          <div className="flex items-center gap-3">
            <div className="hidden text-right leading-tight sm:block">
              <p className="text-sm font-medium text-texto">{admin?.nombre}</p>
              <p className="text-xs capitalize text-marca-500">{admin?.rol}</p>
            </div>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-marca-500/15 text-sm font-bold text-marca-400 ring-1 ring-marca-500/30">
              {admin?.nombre?.[0]?.toUpperCase() || '?'}
            </span>
            <button
              onClick={cerrarSesion}
              className="rounded-lg border border-borde px-3 py-1.5 text-xs font-medium text-texto-suave transition hover:border-red-500/40 hover:text-red-400"
            >
              Cerrar sesión
            </button>
          </div>
        </header>

        <main className="min-w-0 flex-1 bg-fondo p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
