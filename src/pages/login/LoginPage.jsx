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
          <Campo
            etiqueta="Contraseña"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

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
