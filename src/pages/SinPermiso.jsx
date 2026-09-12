import { Link } from 'react-router-dom';

export function SinPermiso() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <p className="text-4xl">🔒</p>
      <h1 className="mt-3 text-lg font-semibold text-slate-900">Sin permiso</h1>
      <p className="mt-1 text-sm text-slate-600">
        Tu rol no tiene acceso a esta sección. Si crees que es un error, contacta a un administrador.
      </p>
      <Link to="/" className="mt-4 inline-block text-sm font-medium text-marca-700 hover:underline">
        Volver al inicio
      </Link>
    </div>
  );
}
