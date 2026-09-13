/**
 * Indicador de conectividad con el backend (GET /health).
 * Útil sobre todo durante el desarrollo: confirma que el proxy de
 * Vite y la base de datos responden.
 */
import { useEffect, useState } from 'react';
import { salud } from '../api/client';

export function EstadoBackend() {
  const [estado, setEstado] = useState('comprobando'); // comprobando | ok | db | caido

  useEffect(() => {
    let vivo = true;
    async function comprobar() {
      try {
        const r = await salud();
        if (!vivo) return;
        setEstado(r?.base_de_datos === 'conectada' ? 'ok' : 'db');
      } catch {
        if (vivo) setEstado('caido');
      }
    }
    comprobar();
    const t = setInterval(comprobar, 30_000);
    return () => {
      vivo = false;
      clearInterval(t);
    };
  }, []);

  const config = {
    comprobando: { color: 'bg-texto-suave/40', texto: 'Comprobando API…' },
    ok: { color: 'bg-green-500', texto: 'API conectada' },
    db: { color: 'bg-amber-500', texto: 'API sin base de datos' },
    caido: { color: 'bg-red-500', texto: 'API no responde' },
  }[estado];

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-texto-suave" title={config.texto}>
      <span className={`h-2 w-2 rounded-full ${config.color}`} />
      <span className="hidden sm:inline">{config.texto}</span>
    </span>
  );
}
