const COLORES = {
  gray: 'bg-white/8 text-texto-suave',
  green: 'bg-green-500/15 text-green-400',
  red: 'bg-red-500/15 text-red-400',
  amber: 'bg-amber-500/15 text-amber-400',
  blue: 'bg-blue-500/15 text-blue-400',
};

/** Badge de estado. `color` = gray | green | red | amber | blue. */
export function Etiqueta({ color = 'gray', children, className = '' }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${COLORES[color] || COLORES.gray} ${className}`}
    >
      {children}
    </span>
  );
}
