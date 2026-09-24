/**
 * pages/clientes/componentes/FlujoRecomendado.jsx  (Clientes CRM, F1)
 * -----------------------------------------
 * Guía de 4 pasos para usuarios no técnicos:
 * Crear cliente → Asignar servicio → Controlar vencimiento → Renovar.
 * Se puede ocultar; la preferencia se recuerda solo en este navegador
 * (localStorage, con try/catch: si el navegador no lo permite, la guía
 * simplemente vuelve a mostrarse).
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';

const CLAVE = 'clientes.flujoOculto';

function leerOculto() {
  try {
    return localStorage.getItem(CLAVE) === '1';
  } catch {
    return false;
  }
}

function guardarOculto(valor) {
  try {
    if (valor) localStorage.setItem(CLAVE, '1');
    else localStorage.removeItem(CLAVE);
  } catch {
    /* sin almacenamiento: no se recuerda, no pasa nada */
  }
}

export function FlujoRecomendado({ onCrearCliente, onVerPorVencer }) {
  const [oculto, setOculto] = useState(leerOculto);

  function cambiar(valor) {
    guardarOculto(valor);
    setOculto(valor);
  }

  if (oculto) {
    return (
      <button type="button" onClick={() => cambiar(false)} className="text-xs font-medium text-marca-400 hover:underline">
        ¿Cómo se trabaja con los clientes? Ver la guía
      </button>
    );
  }

  const pasos = [
    {
      titulo: 'Crear cliente',
      texto: 'Registra su nombre y WhatsApp.',
      accion: (
        <button type="button" onClick={onCrearCliente} className="font-medium text-marca-400 hover:underline">
          Nuevo cliente →
        </button>
      ),
    },
    {
      titulo: 'Asignar servicio',
      texto: 'Crea su pedido, registra el pago y actívalo.',
      accion: (
        <Link to="/pedidos" className="font-medium text-marca-400 hover:underline">
          Ir a Pedidos →
        </Link>
      ),
    },
    {
      titulo: 'Controlar vencimiento',
      texto: 'Revisa quién está por vencer (semáforo 🟡).',
      accion: (
        <button type="button" onClick={onVerPorVencer} className="font-medium text-marca-400 hover:underline">
          Ver por vencer →
        </button>
      ),
    },
    {
      titulo: 'Renovar',
      texto: 'Escríbele a tiempo y renueva su servicio desde su ficha.',
      accion: null,
    },
  ];

  return (
    <section className="rounded-2xl border border-marca-500/20 bg-gradient-to-r from-marca-500/10 via-transparent to-transparent p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-texto">Flujo recomendado</h2>
        <button type="button" onClick={() => cambiar(true)} className="text-xs text-texto-suave hover:text-texto">
          Ocultar guía
        </button>
      </div>
      <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {pasos.map((p, i) => (
          <li key={p.titulo} className="flex gap-3 rounded-xl border border-white/[0.06] bg-black/20 p-3">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-marca-500 text-sm font-bold text-fondo">
              {i + 1}
            </span>
            <div className="min-w-0 text-xs">
              <p className="text-sm font-semibold text-texto">{p.titulo}</p>
              <p className="mt-0.5 text-texto-suave">{p.texto}</p>
              {p.accion && <div className="mt-1.5">{p.accion}</div>}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
