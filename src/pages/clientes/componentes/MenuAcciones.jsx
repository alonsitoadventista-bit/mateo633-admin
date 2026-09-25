/**
 * pages/clientes/componentes/MenuAcciones.jsx  (Clientes CRM, F2 visual)
 * Menú "⋯" con acciones secundarias. Se cierra al elegir, al hacer clic
 * fuera o con Escape. Se posiciona `fixed` bajo el botón (y se reubica con el scroll)
 * para que no lo recorte el scroll horizontal de la tabla. No propaga el
 * clic (en la tabla, el clic en la fila abre la ficha).
 */
import { useEffect, useRef, useState } from 'react';

export function MenuAcciones({ opciones, etiqueta = 'Más acciones', tamano = 'sm' }) {
  const [posicion, setPosicion] = useState(null); // null = cerrado
  const boton = useRef(null);
  const menu = useRef(null);

  useEffect(() => {
    if (!posicion) return undefined;
    const cerrar = () => setPosicion(null);
    const reubicar = () => setPosicion(calcular());
    const alPresionar = (e) => {
      if (!menu.current?.contains(e.target) && !boton.current?.contains(e.target)) cerrar();
    };
    const alTeclear = (e) => e.key === 'Escape' && cerrar();
    document.addEventListener('mousedown', alPresionar);
    document.addEventListener('keydown', alTeclear);
    window.addEventListener('scroll', reubicar, true);
    window.addEventListener('resize', reubicar);
    return () => {
      document.removeEventListener('mousedown', alPresionar);
      document.removeEventListener('keydown', alTeclear);
      window.removeEventListener('scroll', reubicar, true);
      window.removeEventListener('resize', reubicar);
    };
  }, [Boolean(posicion)]); // eslint-disable-line react-hooks/exhaustive-deps

  function calcular() {
    const r = boton.current.getBoundingClientRect();
    return { top: r.bottom + 4, right: Math.max(8, window.innerWidth - r.right) };
  }

  function alternar() {
    setPosicion(posicion ? null : calcular());
  }

  const medida = tamano === 'md' ? 'h-10 w-10' : 'h-8 w-8';

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <button
        ref={boton}
        type="button"
        aria-label={etiqueta}
        title={etiqueta}
        aria-haspopup="menu"
        aria-expanded={Boolean(posicion)}
        onClick={alternar}
        className={`grid ${medida} place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-lg leading-none text-texto-suave transition hover:border-marca-500/50 hover:text-marca-400`}
      >
        ⋯
      </button>
      {posicion && (
        <div
          ref={menu}
          role="menu"
          style={{ position: 'fixed', top: posicion.top, right: posicion.right }}
          className="z-50 min-w-44 overflow-hidden rounded-xl border border-white/10 bg-[#17181c] py-1 shadow-2xl shadow-black/60"
        >
          {opciones.map((o) => (
            <button
              key={o.texto}
              type="button"
              role="menuitem"
              onClick={() => {
                setPosicion(null);
                o.onClick();
              }}
              className="block w-full px-3 py-2 text-left text-sm text-texto transition hover:bg-white/[0.06] hover:text-marca-400"
            >
              {o.texto}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
