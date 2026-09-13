/**
 * pages/auditoria/AuditoriaPage.jsx  (Fase 8)
 * -----------------------------------------
 * Bitácora de todo el sistema: filtros combinables + paginación
 * server-side (único módulo del panel que pagina así, ver
 * Auditoria.listarGeneral en el backend) + exportación a CSV con los
 * mismos filtros. A diferencia de Clientes/Pedidos/Pagos/Servicios/
 * Vendedores, aquí no hay un "detalle" propio por evento (es un log
 * plano, de solo lectura) -- por eso es una sola página, sin router
 * anidado, reutilizando exactamente los mismos componentes del resto
 * del panel.
 */
import { useMemo, useState } from 'react';
import { useApi } from '../../hooks/useApi';
import * as auditoriaApi from '../../api/auditoria';
import { Tarjeta, Tabla, Boton, Campo, Selector, EstadoCarga, EstadoError, EstadoVacio } from '../../components/ui';
import { ACCIONES_AUDITORIA, TIPOS_ACTOR } from '../../utils/constantes';
import { fechaHora, humanizar } from '../../utils/formato';

/** tabla_afectada es texto libre en el backend (sin enum/CHECK) -- esta es la lista de valores
 * realmente usados hoy por los distintos módulos (ver grep sobre `tabla_afectada:` en el backend). */
const TABLAS_AUDITADAS = ['pedidos', 'clientes', 'servicios', 'planes', 'administradores', 'notificaciones_programadas', 'tickets_soporte', 'configuracion'];

const LIMITE = 50;

const FILTROS_VACIOS = { tabla_afectada: '', actor_tipo: '', accion: '', busqueda: '', desde: '', hasta: '' };

export function AuditoriaPage() {
  const [filtros, setFiltros] = useState(FILTROS_VACIOS);
  const [pagina, setPagina] = useState(0);
  const [exportando, setExportando] = useState(false);
  const [errorExportar, setErrorExportar] = useState(null);

  const { data, cargando, error, refetch } = useApi(
    () => auditoriaApi.listar({ ...filtros, limite: LIMITE, offset: pagina * LIMITE }),
    [filtros, pagina]
  );

  const eventos = data?.eventos || [];
  const total = data?.total ?? 0;
  const desde1 = total === 0 ? 0 : pagina * LIMITE + 1;
  const hasta = Math.min((pagina + 1) * LIMITE, total);

  function actualizarFiltro(campo) {
    return (e) => {
      setFiltros((f) => ({ ...f, [campo]: e.target.value }));
      setPagina(0);
    };
  }

  function limpiarFiltros() {
    setFiltros(FILTROS_VACIOS);
    setPagina(0);
  }

  const hayFiltrosActivos = useMemo(() => Object.values(filtros).some((v) => v), [filtros]);

  async function exportar() {
    setExportando(true);
    setErrorExportar(null);
    try {
      await auditoriaApi.exportarCsv(filtros);
    } catch (err) {
      setErrorExportar(err?.message || 'No se pudo exportar el CSV.');
    } finally {
      setExportando(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-texto">Auditoría</h1>
          <p className="text-sm text-texto-suave">Bitácora de todo el sistema: quién hizo qué y cuándo</p>
        </div>
        <div className="flex items-center gap-2">
          <Boton variante="secundario" cargando={exportando} onClick={exportar}>
            Exportar CSV
          </Boton>
        </div>
      </div>

      <Tarjeta>
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Campo
            etiqueta="Buscar"
            name="busqueda"
            placeholder="Acción o detalles…"
            value={filtros.busqueda}
            onChange={actualizarFiltro('busqueda')}
          />
          <Selector
            etiqueta="Módulo"
            name="tabla_afectada"
            placeholder="Todos"
            opciones={TABLAS_AUDITADAS.map((t) => ({ valor: t, texto: humanizar(t) }))}
            value={filtros.tabla_afectada}
            onChange={actualizarFiltro('tabla_afectada')}
          />
          <Selector
            etiqueta="Actor"
            name="actor_tipo"
            placeholder="Todos"
            opciones={TIPOS_ACTOR.map((t) => ({ valor: t, texto: humanizar(t) }))}
            value={filtros.actor_tipo}
            onChange={actualizarFiltro('actor_tipo')}
          />
          <Selector
            etiqueta="Acción"
            name="accion"
            placeholder="Todas"
            opciones={ACCIONES_AUDITORIA.map((a) => ({ valor: a, texto: humanizar(a) }))}
            value={filtros.accion}
            onChange={actualizarFiltro('accion')}
          />
          <Campo etiqueta="Desde" name="desde" type="date" value={filtros.desde} onChange={actualizarFiltro('desde')} />
          <Campo etiqueta="Hasta" name="hasta" type="date" value={filtros.hasta} onChange={actualizarFiltro('hasta')} />
        </div>

        {hayFiltrosActivos && (
          <div className="mb-4">
            <Boton variante="fantasma" tamano="sm" onClick={limpiarFiltros}>
              Limpiar filtros
            </Boton>
          </div>
        )}

        {errorExportar && <p className="mb-3 text-xs text-red-400">{errorExportar}</p>}

        {error ? (
          <EstadoError error={error} onReintentar={refetch} />
        ) : cargando && !data ? (
          <EstadoCarga />
        ) : eventos.length === 0 ? (
          <EstadoVacio
            titulo="Sin eventos"
            descripcion={hayFiltrosActivos ? 'Nada coincide con el filtro actual.' : 'Aún no hay eventos de auditoría.'}
          />
        ) : (
          <>
            <Tabla
              claveFila={(f) => f.id}
              filas={eventos}
              columnas={[
                { clave: 'fecha', titulo: 'Fecha', render: (f) => fechaHora(f.fecha) },
                { clave: 'tabla_afectada', titulo: 'Módulo', render: (f) => humanizar(f.tabla_afectada) },
                { clave: 'registro_id', titulo: 'Registro' },
                { clave: 'accion', titulo: 'Acción', render: (f) => humanizar(f.accion) },
                {
                  clave: 'actor',
                  titulo: 'Actor',
                  render: (f) => f.actor_nombre || `${humanizar(f.actor_tipo)}${f.actor_id ? ` #${f.actor_id}` : ''}`,
                },
                {
                  clave: 'detalles',
                  titulo: 'Detalles',
                  render: (f) =>
                    f.detalles && Object.keys(f.detalles).length > 0 ? (
                      <code className="text-xs text-texto-suave">{JSON.stringify(f.detalles)}</code>
                    ) : (
                      '—'
                    ),
                },
              ]}
            />

            <div className="mt-4 flex items-center justify-between text-sm text-texto-suave">
              <span>
                {desde1}–{hasta} de {total}
              </span>
              <div className="flex gap-2">
                <Boton variante="secundario" tamano="sm" disabled={pagina === 0} onClick={() => setPagina((p) => p - 1)}>
                  ← Anterior
                </Boton>
                <Boton
                  variante="secundario"
                  tamano="sm"
                  disabled={hasta >= total}
                  onClick={() => setPagina((p) => p + 1)}
                >
                  Siguiente →
                </Boton>
              </div>
            </div>
          </>
        )}
      </Tarjeta>
    </div>
  );
}
