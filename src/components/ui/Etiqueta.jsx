const COLORES = {
  gray: 'bg-slate-100 text-slate-700',
  green: 'bg-green-100 text-green-800',
  red: 'bg-red-100 text-red-800',
  amber: 'bg-amber-100 text-amber-800',
  blue: 'bg-blue-100 text-blue-800',
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
