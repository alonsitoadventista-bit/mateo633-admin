/**
 * pages/login/LoginPage.jsx  (Fase 1)
 * -----------------------------------------
 * POST /admin/login. Guarda { token, admin } y entra al panel.
 */
import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import { Boton, Campo } from '../../components/ui';
import { NOMBRE_APP } from '../../config';

export function LoginPage() {
  const { autenticado, iniciarSesion } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const destino = location.state?.from?.pathname || '/';

  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);

  if (autenticado) return <Navigate to={destino} replace />;

  async function enviar(e) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      await iniciarSesion(usuario.trim(), password);
      navigate(destino, { replace: true });
    } catch (err) {
      setError(err?.message || 'No se pudo iniciar sesión.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-fondo p-4">
      {/* Brillo dorado sutil de fondo */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(600px circle at 50% 0%, rgba(212,175,55,0.10), transparent 60%)',
        }}
      />

      <div className="relative w-full max-w-sm rounded-2xl border border-borde bg-superficie p-7 shadow-2xl shadow-black/50">
        <div className="mb-7 flex flex-col items-center gap-3 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-marca-400 to-marca-700 text-fondo shadow-lg shadow-marca-500/30">
            <svg viewBox="0 0 24 24" className="h-8 w-8" fill="currentColor">
              <path d="M3 8.5 6.5 11 9.5 5.5 12 10l2.5-4.5L17.5 11 21 8.5 19.5 18h-15L3 8.5Z" />
            </svg>
          </span>
          <div>
            <p className="text-base font-semibold tracking-wide text-texto">{NOMBRE_APP}</p>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-marca-500">
              Panel de administración
            </p>
          </div>
        </div>

        <form onSubmit={enviar} className="space-y-4">
          <Campo
            etiqueta="Usuario"
            name="usuario"
            autoComplete="username"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            required
            autoFocus
          />
          <label className="block" htmlFor="password">
            <span className="mb-1 block text-sm font-medium text-texto-suave">Contraseña</span>
            <span className="relative block">
              <input
                id="password"
                name="password"
                type={mostrarPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-borde bg-superficie-alta px-3 py-2 pr-10 text-sm text-texto outline-none transition
                  placeholder:text-texto-suave/60
                  focus:border-marca-500 focus:ring-2 focus:ring-marca-500/30"
              />
              <button
                type="button"
                onClick={() => setMostrarPassword((v) => !v)}
                className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-texto-suave transition hover:text-texto"
                aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                tabIndex={-1}
              >
                <IconoOjo abierto={mostrarPassword} className="h-5 w-5" />
              </button>
            </span>
          </label>

          {error && (
            <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
              {error}
            </p>
          )}

          <Boton type="submit" cargando={cargando} className="w-full">
            Entrar
          </Boton>
        </form>
      </div>
    </div>
  );
}

/** Ojo abierto/tachado para el toggle de mostrar/ocultar contraseña. Mismo estilo (línea, currentColor) que IconoNav.jsx, sin dependencia nueva. */
function IconoOjo({ abierto, className = 'h-5 w-5' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {abierto ? (
        <>
          <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
          <circle cx="12" cy="12" r="3" />
        </>
      ) : (
        <>
          <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
          <circle cx="12" cy="12" r="3" />
          <path d="M4 4l16 16" />
        </>
      )}
    </svg>
  );
}
