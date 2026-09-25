/**
 * pages/clientes/componentes/AvatarCliente.jsx  (Clientes CRM, F2 visual)
 * Círculo con las iniciales del cliente, en un degradado fijo por nombre.
 */
import { colorAvatar, iniciales } from '../utilidades';

const MEDIDAS = {
  sm: 'h-9 w-9 text-xs',
  md: 'h-11 w-11 text-sm',
  lg: 'h-16 w-16 text-xl',
};

export function AvatarCliente({ nombre, tamano = 'sm' }) {
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-full bg-gradient-to-br font-bold text-white shadow-md ring-2 ring-black/40 ${MEDIDAS[tamano]} ${colorAvatar(nombre)}`}
    >
      {iniciales(nombre)}
    </span>
  );
}
