/**
 * Estados de carga / error / vacío, consistentes en todo el panel.
 * El backend divide cada pantalla en secciones que cargan por
 * separado; usar uno de estos por sección.
 */
import { Boton } from './Boton';

export function EstadoCarga({ texto = 'Cargando…' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-10 text-sm text-texto-suave">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-borde border-t-marca-500" />
      {texto}
    </div>
  );
}

export function EstadoError({ error, onReintentar }) {
  const mensaje = error?.message || 'Ocurrió un error.';
  const status = error?.status;
  return (
    <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-6 text-center">
      <p className="text-sm font-medium text-red-400">{mensaje}</p>
      {status === 403 && (
        <p className="mt-1 text-xs text-red-400/80">Tu rol no tiene acceso a esta sección.</p>
      )}
      {onReintentar && status !== 403 && (
        <Boton variante="secundario" tamano="sm" className="mt-3" onClick={onReintentar}>
          Reintentar
        </Boton>
      )}
    </div>
  );
}

export function EstadoVacio({ titulo = 'Nada por aquí', descripcion, accion }) {
  return (
    <div className="rounded-lg border border-dashed border-borde px-4 py-10 text-center">
      <p className="text-sm font-medium text-texto">{titulo}</p>
      {descripcion && <p className="mt-1 text-xs text-texto-suave">{descripcion}</p>}
      {accion && <div className="mt-3">{accion}</div>}
    </div>
  );
}
