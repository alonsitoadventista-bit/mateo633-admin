import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <p className="text-4xl">🧭</p>
      <h1 className="mt-3 text-lg font-semibold text-slate-900">Página no encontrada</h1>
      <Link to="/" className="mt-4 inline-block text-sm font-medium text-marca-700 hover:underline">
        Volver al inicio
      </Link>
    </div>
  );
}
