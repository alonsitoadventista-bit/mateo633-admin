/**
 * Tabla simple con scroll horizontal propio (el body de la página nunca
 * debe hacer scroll horizontal).
 *
 *   <Tabla
 *     columnas={[
 *       { clave: 'nombre', titulo: 'Nombre' },
 *       { clave: 'estado', titulo: 'Estado', render: (fila, indice) => ... },
 *     ]}
 *     filas={data}
 *     claveFila={(fila) => fila.id}
 *   />
 */
export function Tabla({ columnas, filas = [], claveFila, onFila, vacio = 'Sin registros.' }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-borde text-left text-xs uppercase tracking-wide text-texto-suave">
            {columnas.map((c) => (
              <th key={c.clave} className="px-3 py-2 font-medium">
                {c.titulo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.length === 0 ? (
            <tr>
              <td colSpan={columnas.length} className="px-3 py-8 text-center text-texto-suave">
                {vacio}
              </td>
            </tr>
          ) : (
            filas.map((fila, i) => (
              <tr
                key={claveFila ? claveFila(fila) : i}
                onClick={onFila ? () => onFila(fila) : undefined}
                className={`border-b border-borde ${onFila ? 'cursor-pointer hover:bg-superficie-alta' : ''}`}
              >
                {columnas.map((c) => (
                  <td key={c.clave} className="px-3 py-2 text-texto">
                    {c.render ? c.render(fila, i) : fila[c.clave] ?? '—'}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
