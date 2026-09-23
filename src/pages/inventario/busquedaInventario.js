/**
 * pages/inventario/busquedaInventario.js
 * -----------------------------------------
 * Filtro del buscador de Inventario, sobre la lista ya cargada (solo
 * frontend, sin tocar backend ni base de datos).
 *
 * - Un solo valor: igual que siempre -- coincidencia parcial, sin
 *   distinguir mayúsculas, en cuenta, número y nombre de perfil,
 *   proveedor, servicio, cliente y WhatsApp.
 * - Varios valores separados por coma (o punto y coma / salto de línea,
 *   para pegar una columna de Excel): cada valor es una búsqueda
 *   independiente y se muestran TODAS las filas que coincidan con
 *   CUALQUIERA de ellos, en una sola lista y sin duplicados.
 *   Excepción: en modo múltiple, un valor que es solo un número corto
 *   (ej. "1,2,3") se compara EXACTO contra el número de perfil -- si no,
 *   "1" también traería el perfil 10 y cualquier WhatsApp con un 1.
 */

const CAMPOS_TEXTO = [
  'identificador_cuenta',
  'numero_perfil',
  'nombre_perfil',
  'proveedor',
  'servicio_nombre',
  'cliente_nombre',
  'cliente_whatsapp',
];

const ES_NUMERO_CORTO = /^[0-9]{1,2}$/;

/** Separa el texto del buscador en valores (sin vacíos ni repetidos). */
export function valoresDeBusqueda(busqueda) {
  const vistos = new Set();
  return String(busqueda || '')
    .split(/[,;\n]/)
    .map((v) => v.trim().toLowerCase())
    .filter((v) => v && !vistos.has(v) && vistos.add(v));
}

function coincideTexto(fila, texto) {
  return CAMPOS_TEXTO.some((campo) => fila[campo] != null && String(fila[campo]).toLowerCase().includes(texto));
}

function coincideValor(fila, valor, multiple) {
  if (multiple && ES_NUMERO_CORTO.test(valor)) {
    return String(fila.numero_perfil ?? '').trim() === String(Number(valor));
  }
  return coincideTexto(fila, valor);
}

/**
 * Devuelve { filas, conteos }: las filas que coinciden (en el orden
 * original de la lista, sin duplicados -- cada fila se evalúa una sola
 * vez) y, en modo múltiple, cuántas filas encontró cada valor.
 */
export function filtrarInventario(filas, busqueda) {
  const valores = valoresDeBusqueda(busqueda);
  if (valores.length === 0) return { filas, conteos: [] };

  const multiple = valores.length > 1;
  const conteos = valores.map((valor) => ({ valor, cantidad: 0 }));
  const resultado = filas.filter((fila) => {
    let coincide = false;
    conteos.forEach((c) => {
      if (coincideValor(fila, c.valor, multiple)) {
        c.cantidad += 1;
        coincide = true;
      }
    });
    return coincide;
  });
  return { filas: resultado, conteos: multiple ? conteos : [] };
}
