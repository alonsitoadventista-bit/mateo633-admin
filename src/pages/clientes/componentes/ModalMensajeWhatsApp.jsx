/**
 * pages/clientes/componentes/ModalMensajeWhatsApp.jsx  (Clientes CRM, F1)
 * -----------------------------------------
 * Muestra un mensaje preparado por el backend (GET /admin/clientes/:id/mensajes),
 * deja editarlo y lo abre en WhatsApp (wa.me) para enviarlo a mano.
 * Sin API todavía: el panel no sabe si se envió. Cuando exista la API de
 * WhatsApp, el mismo `mensaje` (tipo + texto) se enviará por el backend.
 */
import { useEffect, useState } from 'react';
import { Boton, Modal } from '../../../components/ui';
import { enlaceWhatsApp, whatsappVisible } from '../../../utils/whatsapp';

export function ModalMensajeWhatsApp({ mensaje, nombreCliente, onCerrar }) {
  const [texto, setTexto] = useState('');
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    setTexto(mensaje?.texto || '');
    setCopiado(false);
  }, [mensaje]);

  if (!mensaje) return null;
  const enlace = enlaceWhatsApp(mensaje.whatsapp, texto);

  function abrir() {
    if (enlace) window.open(enlace, '_blank', 'noopener');
    onCerrar();
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
    } catch {
      /* sin portapapeles */
    }
  }

  return (
    <Modal
      abierto
      titulo={mensaje.titulo}
      onCerrar={onCerrar}
      pie={
        <>
          <Boton variante="secundario" onClick={copiar}>
            {copiado ? 'Copiado ✓' : 'Copiar texto'}
          </Boton>
          <Boton onClick={abrir} disabled={!enlace || !texto.trim()}>
            Abrir en WhatsApp
          </Boton>
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-sm text-texto-suave">
          Para <span className="font-medium text-texto">{nombreCliente}</span> · {whatsappVisible(mensaje.whatsapp)}
        </p>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-texto-suave">Mensaje (puedes editarlo)</span>
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={7}
            className="w-full rounded-lg border border-borde bg-superficie-alta px-3 py-2 text-sm text-texto outline-none transition focus:border-marca-500 focus:ring-2 focus:ring-marca-500/30"
          />
        </label>
        <p className="text-xs text-texto-suave">
          Se abrirá WhatsApp con este texto listo. Revísalo y presiona enviar en WhatsApp.
        </p>
        {!enlace && <p className="text-xs text-red-400">El número de WhatsApp del cliente no es válido. Corrígelo en "Editar datos".</p>}
      </div>
    </Modal>
  );
}
