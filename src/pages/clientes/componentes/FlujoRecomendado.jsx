/**
 * pages/clientes/componentes/FlujoRecomendado.jsx  (Clientes CRM, F1 → F2 visual)
 * -----------------------------------------
 * Botón "¿Cómo funciona?" que abre la guía de 4 pasos para usuarios no técnicos:
 * Crear cliente → Asignar servicio → Controlar vencimiento → Renovar.
 * (En F1 era un panel fijo; en F2 pasa a un modal para no ocupar la pantalla.)
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Boton, Modal } from '../../../components/ui';

export function FlujoRecomendado({ onCrearCliente, onVerPorVencer }) {
  const [abierto, setAbierto] = useState(false);
  const ir = (fn) => () => {
    setAbierto(false);
    fn();
  };

  const pasos = [
    {
      titulo: 'Crear cliente',
      texto: 'Registra su nombre y su WhatsApp.',
      accion: <button type="button" onClick={ir(onCrearCliente)} className="font-medium text-marca-400 hover:underline">Nuevo cliente →</button>,
    },
    {
      titulo: 'Asignar servicio',
      texto: 'Crea su pedido, registra el pago y actívalo.',
      accion: <Link to="/pedidos" className="font-medium text-marca-400 hover:underline">Ir a Pedidos →</Link>,
    },
    {
      titulo: 'Controlar vencimiento',
      texto: 'Revisa a diario quién está por vencer (🟡) y usa su "Próxima acción".',
      accion: <button type="button" onClick={ir(onVerPorVencer)} className="font-medium text-marca-400 hover:underline">Ver por vencer →</button>,
    },
    {
      titulo: 'Renovar',
      texto: 'Escríbele con el mensaje preparado y usa "Renovar" en su fila o en su ficha.',
      accion: null,
    },
  ];

  return (
    <>
      <Boton variante="secundario" onClick={() => setAbierto(true)}>
        ¿Cómo funciona?
      </Boton>
      <Modal abierto={abierto} titulo="Cómo trabajar con tus clientes" onCerrar={() => setAbierto(false)}>
        <ol className="space-y-3">
          {pasos.map((p, i) => (
            <li key={p.titulo} className="flex gap-3 rounded-xl border border-white/[0.06] bg-black/20 p-3">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-marca-500 text-sm font-bold text-fondo">{i + 1}</span>
              <div className="min-w-0 text-sm">
                <p className="font-semibold text-texto">{p.titulo}</p>
                <p className="text-texto-suave">{p.texto}</p>
                {p.accion && <div className="mt-1 text-xs">{p.accion}</div>}
              </div>
            </li>
          ))}
        </ol>
      </Modal>
    </>
  );
}
