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
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-marca-700 text-xs font-bold text-white">
            6:33
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-800">{NOMBRE_APP}</p>
            <p className="text-xs text-slate-500">Panel de administración</p>
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
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
          )}

          <Boton type="submit" cargando={cargando} className="w-full">
            Entrar
          </Boton>
        </form>
      </div>
    </div>
  );
}
