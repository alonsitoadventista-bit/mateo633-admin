/**
 * pages/clientes/componentes/HistorialCliente.jsx  (Clientes CRM, F1)
 * -----------------------------------------
 * GET /admin/clientes/:id/historial → línea de tiempo en lenguaje simple:
 * compras, renovaciones, pagos, activaciones (con su vencimiento), perfiles,
 * entregas, vencimientos y cambios de datos (antes → después), con quién lo
 * hizo. Filtro rápido por tipo.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../../hooks/useApi';
import * as clientesApi from '../../../api/clientes';
import { EstadoCarga, EstadoError, EstadoVacio } from '../../../components/ui';
import { IconoNav } from '../../../components/IconoNav.jsx';
import { TEXTO_ACCESO_CLIENTE } from '../../../utils/constantes';
import { fecha, fechaHora, humanizar, moneda } from '../../../utils/formato';
import { Segmentos } from '../../dashboard/piezas.jsx';

const FILTROS = [
  { valor: 'todo', texto: 'Todo' },
  { valor: 'compras', texto: 'Compras y renovaciones' },
  { valor: 'pagos', texto: 'Pagos' },
  { valor: 'servicio', texto: 'Perfiles y entregas' },
  { valor: 'cambios', texto: 'Cambios de datos' },
];

const CAMPOS = { nombre: 'Nombre', email: 'Correo', whatsapp: 'WhatsApp', estado: 'Acceso' };

function valorCampo(campo, v) {
  if (v === null || v === undefined || v === '') return 'vacío';
  return campo === 'estado' ? TEXTO_ACCESO_CLIENTE[v] || v : v;
}

/** Texto, ícono, color y categoría de cada acción de auditoría. */
function describir(e) {
  const d = e.detalles || {};
  switch (e.accion) {
    case 'pedido_creado':
      return e.es_renovacion
        ? { cat: 'compras', icono: 'actualizar', color: 'text-marca-400', titulo: 'Renovación solicitada' }
        : { cat: 'compras', icono: 'carrito', color: 'text-marca-400', titulo: 'Compra solicitada' };
    case 'servicio_activado':
      return {
        cat: 'compras',
        icono: 'check',
        color: 'text-emerald-400',
        titulo: 'Servicio activado',
        detalle: d.fecha_vencimiento ? `Vencimiento: ${fecha(d.fecha_vencimiento)}` : null,
      };
    case 'pedido_vencido':
      return { cat: 'compras', icono: 'reloj', color: 'text-rose-400', titulo: 'Servicio vencido' };
    case 'pedido_cancelado':
      return { cat: 'compras', icono: 'critico', color: 'text-texto-suave', titulo: 'Pedido cancelado' };
    case 'pago_confirmado':
      return { cat: 'pagos', icono: 'billetera', color: 'text-emerald-400', titulo: `Pago confirmado${d.monto ? `: ${moneda(d.monto)}` : ''}`, detalle: d.metodo ? `Método: ${d.metodo}` : null };
    case 'pago_rechazado':
      return { cat: 'pagos', icono: 'alerta', color: 'text-rose-400', titulo: 'Pago rechazado', detalle: d.motivo || null };
    case 'pago_reportado_cliente':
    case 'pago_reportado_manychat':
      return { cat: 'pagos', icono: 'pagos', color: 'text-sky-400', titulo: 'El cliente reportó un pago' };
    case 'perfil_asignado':
      return { cat: 'servicio', icono: 'inventario', color: 'text-sky-400', titulo: `Perfil asignado${d.numero_perfil ? ` (perfil ${d.numero_perfil})` : ''}` };
    case 'cuenta_liberada':
      return { cat: 'servicio', icono: 'inventario', color: 'text-texto-suave', titulo: 'Perfil liberado' };
    case 'credenciales_entregadas':
      return { cat: 'servicio', icono: 'whatsapp', color: 'text-emerald-400', titulo: `Credenciales entregadas${d.canal === 'whatsapp' ? ' por WhatsApp' : d.canal === 'copiado' ? ' (copiadas)' : ''}` };
    case 'entrega_manual_emergencia':
      return { cat: 'servicio', icono: 'alerta', color: 'text-amber-400', titulo: 'Entrega manual de emergencia' };
    case 'datos_cliente_editados':
    case 'estado_cliente_cambiado': {
      const cambios = Object.entries(d.campos_modificados || {});
      return {
        cat: 'cambios',
        icono: 'configuracion',
        color: 'text-texto-suave',
        titulo: e.accion === 'estado_cliente_cambiado' ? 'Acceso cambiado' : 'Datos del cliente editados',
        cambios: cambios.map(([campo, v]) => `${CAMPOS[campo] || campo}: ${valorCampo(campo, v.antes)} → ${valorCampo(campo, v.despues)}`),
      };
    }
    case 'cliente_registrado_por_staff':
      return { cat: 'cambios', icono: 'clientes', color: 'text-marca-400', titulo: 'Cliente registrado desde el panel' };
    case 'cliente_registrado':
      return { cat: 'cambios', icono: 'clientes', color: 'text-marca-400', titulo: 'Cliente registrado' };
    default:
      return { cat: 'todo', icono: 'info', color: 'text-texto-suave', titulo: humanizar(e.accion) };
  }
}

export function HistorialCliente({ clienteId }) {
  const { data, cargando, error, refetch } = useApi(() => clientesApi.historial(clienteId), [clienteId]);
  const [filtro, setFiltro] = useState('todo');

  if (error) return <EstadoError error={error} onReintentar={refetch} />;
  if (cargando && !data) return <EstadoCarga />;

  const eventos = (data || []).map((e) => ({ ...e, ...describir(e) })).filter((e) => filtro === 'todo' || e.cat === filtro);

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <Segmentos opciones={FILTROS} valor={filtro} onCambio={setFiltro} etiqueta="Tipo de evento" />
      </div>
      {eventos.length === 0 ? (
        <EstadoVacio titulo="Sin eventos" descripcion="No hay movimientos de este tipo." />
      ) : (
        <ol className="relative space-y-4 border-l border-white/10 pl-6">
          {eventos.map((e, i) => (
            <li key={e.id ?? `alta-${i}`} className="relative">
              <span className={`absolute -left-[37px] grid h-7 w-7 place-items-center rounded-full border border-white/10 bg-[#121316] ${e.color}`}>
                <IconoNav nombre={e.icono} className="h-3.5 w-3.5" />
              </span>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <p className="text-sm font-medium text-texto">
                  {e.titulo}
                  {e.servicio_nombre && <span className="text-texto-suave"> · {e.servicio_nombre}</span>}
                </p>
                <time className="text-xs text-texto-suave">{fechaHora(e.fecha)}</time>
              </div>
              {e.detalle && <p className="text-xs text-texto/80">{e.detalle}</p>}
              {e.cambios?.map((c) => (
                <p key={c} className="text-xs text-texto/80">
                  {c}
                </p>
              ))}
              <p className="text-xs text-texto-suave">
                {e.actor_nombre || 'Panel'}
                {e.pedido_id && (
                  <>
                    {' · '}
                    <Link to={`/pedidos/${e.pedido_id}`} className="text-marca-400 hover:underline">
                      pedido #{e.pedido_id}
                    </Link>
                  </>
                )}
              </p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
