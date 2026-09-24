/**
 * pages/clientes/componentes/Semaforo.jsx  (Clientes CRM, F1)
 * -----------------------------------------
 * Semáforo del estado comercial: 🟢 al día · 🟡 por vencer · 🔴 vencido ·
 * ⚪ inactivo. Siempre punto + texto (nunca solo color); la ayuda sale al
 * pasar el mouse para quien no sabe qué significa cada estado.
 */
import { ESTADOS_COMERCIALES } from '../../../utils/constantes';

/** Texto corto de días: "Vence hoy", "Vence mañana", "En 5 días", "Venció hace 3 días". */
export function textoDias(dias) {
  if (dias === null || dias === undefined) return '';
  if (dias < 0) return `Venció hace ${-dias} día${dias === -1 ? '' : 's'}`;
  if (dias === 0) return 'Vence hoy';
  if (dias === 1) return 'Vence mañana';
  return `En ${dias} días`;
}

export function Semaforo({ estado, tamano = 'sm' }) {
  const e = ESTADOS_COMERCIALES[estado] || ESTADOS_COMERCIALES.inactivo;
  const medida = tamano === 'md' ? 'px-3 py-1 text-sm' : 'px-2.5 py-0.5 text-xs';
  return (
    <span
      title={e.ayuda}
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border font-medium ${medida} ${e.clase}`}
    >
      <span className={`h-2 w-2 shrink-0 rounded-full ${e.punto}`} aria-hidden="true" />
      {e.texto}
    </span>
  );
}

/** Etiquetas calculadas (cliente nuevo, varios servicios, frecuente, premium). */
export function EtiquetasCliente({ etiquetas }) {
  if (!etiquetas?.length) return null;
  return (
    <span className="inline-flex flex-wrap gap-1">
      {etiquetas.map((e) => (
        <span
          key={e.clave}
          className="rounded-md border border-marca-500/30 bg-marca-500/10 px-1.5 py-0.5 text-[11px] font-medium text-marca-400"
        >
          {e.titulo}
        </span>
      ))}
    </span>
  );
}
