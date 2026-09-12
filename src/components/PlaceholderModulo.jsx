/**
 * PlaceholderModulo
 * -----------------------------------------
 * Marcador de módulo aún no construido. Documenta en pantalla qué
 * fase lo implementa y qué endpoints del backend usará, para que
 * quien retome el trabajo tenga el contrato a la vista.
 */
export function PlaceholderModulo({ titulo, fase, descripcion, endpoints = [], permiso }) {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold text-slate-900">{titulo}</h1>
          <span className="rounded-full bg-marca-50 px-2 py-0.5 text-xs font-medium text-marca-800">
            Fase {fase}
          </span>
        </div>
        {permiso && <p className="mt-1 text-xs font-medium text-slate-500">Permiso: {permiso}</p>}
        {descripcion && <p className="mt-3 text-sm text-slate-600">{descripcion}</p>}

        {endpoints.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Endpoints del backend
            </p>
            <ul className="space-y-1">
              {endpoints.map((e) => (
                <li key={e} className="font-mono text-xs text-slate-600">
                  {e}
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="mt-6 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
          Scaffold listo (Fase 0). La capa <code className="font-mono">src/api/</code> ya expone estas
          llamadas conectadas al backend.
        </p>
      </div>
    </div>
  );
}
