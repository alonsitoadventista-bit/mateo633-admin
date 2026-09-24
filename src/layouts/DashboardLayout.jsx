/**
 * layouts/DashboardLayout.jsx
 * -----------------------------------------
 * Marco del panel: barra lateral (filtrada por rol) + barra superior
 * + <Outlet/> para el módulo activo. Responsive: la lateral se colapsa
 * bajo el breakpoint md y se abre con el botón ☰.
 *
 * Fase visual 2026-09-24: la lateral ocupa siempre el alto de la ventana
 * (sticky; antes terminaba a media página) y lleva la tarjeta "Soporte
 * rápido" con el WhatsApp de soporte, leído de la ruta PÚBLICA de solo
 * lectura GET /configuracion/soporte (la misma que usa la app cliente).
 */
import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { useApi } from '../hooks/useApi';
import * as configuracionApi from '../api/configuracion';
import { NAVEGACION } from './navegacion';
import { IconoNav } from '../components/IconoNav.jsx';
import { EstadoBackend } from './EstadoBackend.jsx';

/** '51939069653' -> '+51 939 069 653' (Perú); otros números: '+' + dígitos. */
function formatoTelefono(digitos) {
  if (/^51\d{9}$/.test(digitos)) return `+51 ${digitos.slice(2, 5)} ${digitos.slice(5, 8)} ${digitos.slice(8)}`;
  return `+${digitos}`;
}

function SoporteRapido() {
  const { data } = useApi(() => configuracionApi.soporte(), []);
  const numero = data?.whatsapp;
  if (!numero) return null; // sin número configurado (o la consulta falló): no se muestra nada inventado
  return (
    <a
      href={`https://wa.me/${numero}`}
      target="_blank"
      rel="noreferrer"
      className="mx-3 mb-3 flex items-center gap-3 rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/15 to-transparent px-3 py-3 transition hover:border-emerald-400/50"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-green-600 text-white shadow-lg shadow-green-500/30">
        <IconoNav nombre="whatsapp" className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-texto">Soporte rápido</span>
        <span className="block truncate text-xs tabular-nums text-texto/80">{formatoTelefono(numero)}</span>
      </span>
    </a>
  );
}

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
        className={`fixed inset-y-0 left-0 z-40 flex h-screen w-64 shrink-0 flex-col border-r border-white/[0.06] bg-gradient-to-b from-[#111114] to-[#08080a] transition-transform
          md:sticky md:top-0 md:translate-x-0 ${abiertoMovil ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-6">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-marca-400 to-marca-700 text-fondo shadow-lg shadow-marca-500/30">
            <IconoNav nombre="corona" className="h-7 w-7" />
          </span>
          <div className="leading-tight">
            <p className="text-lg font-bold text-texto">Mateo 6:33</p>
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-marca-400">Premium</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
          {items.map((item) => (
            <NavLink
              key={item.ruta}
              to={item.ruta}
              end={item.exacto}
              onClick={() => setAbiertoMovil(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-gradient-to-r from-marca-400 to-marca-600 font-semibold text-fondo shadow-lg shadow-marca-500/25'
                    : 'text-texto/75 hover:translate-x-0.5 hover:bg-white/[0.04] hover:text-texto'
                }`
              }
            >
              <IconoNav nombre={item.icono} className="h-5 w-5 shrink-0" />
              <span className="truncate">{item.etiqueta}</span>
            </NavLink>
          ))}
        </nav>

        <SoporteRapido />

        <div className="relative overflow-hidden border-t border-white/[0.06] px-4 py-3">
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: 'radial-gradient(120px circle at 50% 100%, rgba(212,175,55,0.12), transparent 70%)' }}
          />
          <p className="relative text-center font-serif text-sm italic text-marca-400/90">Tu entretenimiento sin límites</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-white/[0.06] bg-[#0b0b0d]/85 px-4 py-3 backdrop-blur md:px-6">
          <div className="flex items-center gap-3">
            <button
              className="rounded-lg p-1.5 text-texto-suave hover:bg-white/[0.05] hover:text-texto md:hidden"
              onClick={() => setAbiertoMovil(true)}
              aria-label="Abrir menú"
            >
              ☰
            </button>
            <EstadoBackend />
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right leading-tight sm:block">
              <p className="text-sm font-semibold text-texto">{admin?.nombre}</p>
              <p className="text-xs capitalize text-marca-400">{admin?.rol}</p>
            </div>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-marca-400 to-marca-700 text-sm font-bold text-fondo shadow-md shadow-marca-500/20">
              {admin?.nombre?.[0]?.toUpperCase() || '?'}
            </span>
            <button
              onClick={cerrarSesion}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-texto-suave transition hover:border-red-500/40 hover:text-red-400"
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
