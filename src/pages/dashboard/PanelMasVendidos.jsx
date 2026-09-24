/**
 * pages/dashboard/PanelMasVendidos.jsx  (Dashboard 2026-09-24)
 * -----------------------------------------
 * GET /admin/dashboard/servicios-mas-vendidos?limite=6&dias=
 * Ranking por pedidos pagados (pagado/activo/vencido) en el rango elegido.
 * Barras horizontales de una sola serie (un color): la longitud es la
 * cantidad; al lado, la cantidad y su % del total vendido en el rango.
 */
import { useState } from 'react';
import { useApi } from '../../hooks/useApi';
import * as dashboardApi from '../../api/dashboard';
import { Tarjeta, EstadoCarga, EstadoError, EstadoVacio } from '../../components/ui';
import { moneda, numero } from '../../utils/formato';
import { IconoServicio, Segmentos } from './piezas.jsx';

const LIMITE = 6;
const RANGOS = [
  { valor: '7', texto: '7 días' },
  { valor: '30', texto: '30 días' },
  { valor: 'todo', texto: 'Todo' },
];

export function PanelMasVendidos({ recargar }) {
  const [rango, setRango] = useState('30');
  const { data, cargando, error, refetch } = useApi(
    () => dashboardApi.masVendidos(LIMITE, rango === 'todo' ? null : Number(rango)),
    [rango, recargar]
  );
  const filas = Array.isArray(data) ? data : [];
  const maximo = Math.max(1, ...filas.map((f) => Number(f.cantidad_vendida) || 0));

  return (
    <Tarjeta
      titulo="Servicios más vendidos"
      acciones={<Segmentos etiqueta="Rango del ranking" opciones={RANGOS} valor={rango} onCambio={setRango} />}
    >
      {error ? (
        <EstadoError error={error} onReintentar={refetch} />
      ) : cargando && !data ? (
        <EstadoCarga />
      ) : filas.length === 0 ? (
        <EstadoVacio titulo="Sin ventas" descripcion="No hay pedidos pagados en este rango." />
      ) : (
        <ol className="space-y-3">
          {filas.map((f, i) => {
            const cantidad = Number(f.cantidad_vendida) || 0;
            return (
              <li
                key={f.id}
                className="grid grid-cols-[1.25rem_minmax(0,9rem)_1fr_auto] items-center gap-3 text-sm"
                title={`${f.nombre}: ${numero(cantidad)} vendidos · ${moneda(f.ingresos_generados)}`}
              >
                <span className="text-xs font-semibold text-texto-suave">{i + 1}</span>
                <span className="flex min-w-0 items-center gap-2">
                  <IconoServicio nombre={f.nombre} imagenUrl={f.imagen_url} />
                  <span className="truncate text-texto">{f.nombre}</span>
                </span>
                <span className="h-2 rounded-full bg-superficie-alta">
                  <span
                    className="block h-2 rounded-full bg-marca-500"
                    style={{ width: `${Math.max(3, (cantidad / maximo) * 100)}%` }}
                  />
                </span>
                <span className="whitespace-nowrap text-right text-texto">
                  <span className="font-semibold">{numero(cantidad)}</span>{' '}
                  <span className="text-xs text-texto-suave">({numero(f.porcentaje)}%)</span>
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </Tarjeta>
  );
}
