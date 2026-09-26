/**
 * pages/pedidos/BarraOperativa.jsx
 * -----------------------------------------
 * Barra de acciones operativas del detalle del pedido, con la MISMA
 * organización que la ficha del cliente (usuario, 2026-09-26):
 *   1. Contactar por WhatsApp · 2. Renovar · 3. Credenciales ·
 *   4. Modificar cuenta/perfil (solo administrador) · 5. Editar · 6. ⋯
 * - Renovar: el mismo flujo de un paso que Clientes (DialogoRenovar →
 *   renovar-y-confirmar): conserva todo y suma los días del plan.
 * - Credenciales y Modificar cuenta/perfil: los abre quien la usa (sus modales
 *   ya existen en el detalle del pedido) con `onCredenciales` / `onModificar`.
 * - Editar: datos del cliente (el mismo modal de la ficha).
 * - `extras`: acciones de la situación (asignar, liberar...), antes del menú.
 * - `opciones`: acciones poco frecuentes dentro de ⋯.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as clientesApi from '../../api/clientes';
import { Boton } from '../../components/ui';
import { IconoNav } from '../../components/IconoNav.jsx';
import { enlaceWhatsApp } from '../../utils/whatsapp';
import { DialogoRenovar } from '../clientes/componentes/DialogoRenovar.jsx';
import { ModalEditarCliente } from '../clientes/componentes/ModalEditarCliente.jsx';
import { MenuAcciones } from '../clientes/componentes/MenuAcciones.jsx';

const TITULO_MODIFICAR = 'Solo casos especiales: cambia cuenta, correo, contraseña, perfil o PIN (motivo obligatorio, queda en la auditoría)';

export function BarraOperativa({ pedido, puedeRenovar, onCredenciales, onModificar, extras = null, opciones = [], onCambiado }) {
  const navigate = useNavigate();
  const [renovando, setRenovando] = useState(null);
  const [recargarAlCerrar, setRecargarAlCerrar] = useState(false);
  const [cliente, setCliente] = useState(null); // resumen del cliente para "Editar"
  const [errorEditar, setErrorEditar] = useState(null);
  const enlace = enlaceWhatsApp(pedido.cliente_whatsapp);

  async function editar() {
    setErrorEditar(null);
    try {
      setCliente(await clientesApi.resumen(pedido.cliente_id));
    } catch (err) {
      setErrorEditar(err?.message || 'No se pudo cargar el cliente.');
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => enlace && window.open(enlace, '_blank', 'noopener')}
        disabled={!enlace}
        title="Abre el chat de WhatsApp del cliente"
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white shadow shadow-emerald-900/40 transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <IconoNav nombre="whatsapp" className="h-4 w-4" />
        Contactar por WhatsApp
      </button>
      {puedeRenovar && (
        <Boton
          variante="secundario"
          tamano="md"
          onClick={() => setRenovando({ pedido_id: pedido.id, servicio_nombre: pedido.servicio_nombre, cliente_nombre: pedido.cliente_nombre })}
        >
          <IconoNav nombre="actualizar" className="h-4 w-4" />
          Renovar
        </Boton>
      )}
      {onCredenciales && (
        <Boton variante="secundario" tamano="md" onClick={onCredenciales}>
          <IconoNav nombre="inventario" className="h-4 w-4" />
          Credenciales
        </Boton>
      )}
      {onModificar && (
        <button
          type="button"
          onClick={onModificar}
          title={TITULO_MODIFICAR}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3.5 py-2 text-sm font-medium text-amber-300 transition hover:border-amber-400/70"
        >
          <IconoNav nombre="alerta" className="h-4 w-4" />
          Modificar cuenta/perfil
        </button>
      )}
      <Boton variante="secundario" tamano="md" onClick={editar}>
        <IconoNav nombre="configuracion" className="h-4 w-4" />
        Editar
      </Boton>
      {extras}
      <MenuAcciones
        tamano="md"
        opciones={[{ texto: 'Ver ficha del cliente', onClick: () => navigate(`/clientes/${pedido.cliente_id}`) }, ...opciones]}
      />
      {errorEditar && <p className="basis-full text-xs text-red-400">{errorEditar}</p>}

      {/* El pedido se recarga al CERRAR el mensaje: al renovarse pasa a "renovado" y esta barra
          desaparece; recargar antes se llevaría el mensaje de confirmación. */}
      <DialogoRenovar
        objetivo={renovando}
        onCerrar={() => {
          setRenovando(null);
          if (recargarAlCerrar) {
            setRecargarAlCerrar(false);
            onCambiado?.();
          }
        }}
        onRenovado={() => setRecargarAlCerrar(true)}
      />
      <ModalEditarCliente
        abierto={Boolean(cliente)}
        cliente={cliente}
        onCerrar={() => setCliente(null)}
        onGuardado={() => {
          setCliente(null);
          onCambiado?.();
        }}
      />
    </>
  );
}
