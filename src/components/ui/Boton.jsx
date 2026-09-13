const VARIANTES = {
  primario: 'bg-marca-500 text-fondo hover:bg-marca-400 disabled:bg-marca-500/40 shadow shadow-marca-500/20',
  secundario: 'bg-superficie-alta text-texto border border-borde hover:border-marca-500/40 hover:bg-superficie-alta/70',
  peligro: 'bg-red-600 text-white hover:bg-red-500 disabled:bg-red-600/50',
  fantasma: 'bg-transparent text-texto-suave hover:bg-superficie-alta hover:text-texto',
};

const TAMANOS = {
  sm: 'px-2.5 py-1 text-xs',
  md: 'px-3.5 py-2 text-sm',
};

export function Boton({
  variante = 'primario',
  tamano = 'md',
  cargando = false,
  disabled,
  className = '',
  children,
  ...props
}) {
  return (
    <button
      disabled={disabled || cargando}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition
        disabled:cursor-not-allowed disabled:opacity-70 ${VARIANTES[variante]} ${TAMANOS[tamano]} ${className}`}
      {...props}
    >
      {cargando && (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
}
