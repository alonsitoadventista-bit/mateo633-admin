/**
 * hooks/useApi.js
 * -----------------------------------------
 * Carga genérica de datos desde la capa api/. Devuelve
 * { data, cargando, error, refetch, setData }.
 *
 *   const { data, cargando, error, refetch } = useApi(() => clientesApi.listar(estado), [estado]);
 *
 * Para acciones bajo demanda (crear/editar), pasar { inmediato: false }
 * y llamar refetch(args) manualmente.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

export function useApi(fn, deps = [], { inmediato = true } = {}) {
  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(inmediato);
  const [error, setError] = useState(null);
  const vivo = useRef(true);

  useEffect(() => {
    vivo.current = true;
    return () => {
      vivo.current = false;
    };
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const ejecutar = useCallback(async (...args) => {
    setCargando(true);
    setError(null);
    try {
      const resultado = await fn(...args);
      if (vivo.current) setData(resultado);
      return resultado;
    } catch (e) {
      if (vivo.current) setError(e);
      throw e;
    } finally {
      if (vivo.current) setCargando(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    if (inmediato) ejecutar().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ejecutar]);

  return { data, cargando, error, refetch: ejecutar, setData };
}
