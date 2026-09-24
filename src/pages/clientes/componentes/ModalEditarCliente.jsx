/**
 * pages/clientes/componentes/ModalEditarCliente.jsx  (Clientes CRM, F1)
 * -----------------------------------------
 * PUT /admin/clientes/:id — body: { nombre, whatsapp, email }.
 * Se usa desde la lista (acción "Editar") y desde la ficha.
 * - El correo vacío se envía como null: el backend lo BORRA.
 * - El WhatsApp se muestra como quedará guardado (+51 ...), antes de guardar.
 */
import { useEffect, useState } from 'react';
import * as clientesApi from '../../../api/clientes';
import { Boton, Campo, Modal } from '../../../components/ui';
import { normalizarWhatsapp, whatsappVisible } from '../../../utils/whatsapp';

/** Aviso bajo el campo WhatsApp: cómo se guardará, o por qué no sirve. */
export function AyudaWhatsapp({ valor }) {
  if (!valor.trim()) {
    return <p className="text-xs text-texto-suave">Con código de país. Si es de Perú, basta con los 9 dígitos.</p>;
  }
  return normalizarWhatsapp(valor) ? (
    <p className="text-xs text-emerald-300">Se guardará como {whatsappVisible(valor)}</p>
  ) : (
    <p className="text-xs text-amber-300">Número incompleto: revisa los dígitos.</p>
  );
}

export function ModalEditarCliente({ abierto, cliente, onCerrar, onGuardado }) {
  const [campos, setCampos] = useState({ nombre: '', whatsapp: '', email: '' });
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (abierto && cliente) {
      setCampos({ nombre: cliente.nombre || '', whatsapp: cliente.whatsapp || '', email: cliente.email || '' });
      setError(null);
    }
  }, [abierto, cliente]);

  function actualizar(campo) {
    return (e) => setCampos((c) => ({ ...c, [campo]: e.target.value }));
  }

  async function enviar(e) {
    e.preventDefault();
    setCargando(true);
    setError(null);
    try {
      await clientesApi.actualizarDatos(cliente.id, {
        nombre: campos.nombre.trim(),
        whatsapp: campos.whatsapp.trim(),
        email: campos.email.trim() || null,
      });
      onGuardado();
    } catch (err) {
      setError(err?.message || 'No se pudieron guardar los cambios.');
    } finally {
      setCargando(false);
    }
  }

  if (!cliente) return null;

  return (
    <Modal
      abierto={abierto}
      titulo="Editar cliente"
      onCerrar={cargando ? undefined : onCerrar}
      pie={
        <>
          <Boton variante="secundario" onClick={onCerrar} disabled={cargando}>
            Cancelar
          </Boton>
          <Boton type="submit" form="form-editar-cliente" cargando={cargando}>
            Guardar cambios
          </Boton>
        </>
      }
    >
      <form id="form-editar-cliente" onSubmit={enviar} className="space-y-4">
        <Campo etiqueta="Nombre" name="nombre" value={campos.nombre} onChange={actualizar('nombre')} required autoFocus />
        <div className="space-y-1">
          <Campo
            etiqueta="WhatsApp"
            name="whatsapp"
            placeholder="+51 987 654 321"
            value={campos.whatsapp}
            onChange={actualizar('whatsapp')}
            required
          />
          <AyudaWhatsapp valor={campos.whatsapp} />
        </div>
        <div className="space-y-1">
          <Campo etiqueta="Email (opcional)" name="email" type="email" value={campos.email} onChange={actualizar('email')} />
          <p className="text-xs text-texto-suave">Déjalo vacío para quitar el correo.</p>
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </form>
    </Modal>
  );
}
