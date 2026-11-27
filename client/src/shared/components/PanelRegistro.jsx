import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useEsEscritorio } from '../hooks/useMediaQuery.js';
import { useT } from '../preferencias/traducir.js';

/**
 * Contenedor del formulario de registro.
 * - Celular: pantalla completa y modal (el monto va primero y se abre el teclado numérico).
 * - Escritorio: panel lateral que no tapa el historial ni lo bloquea.
 * Escape lo cierra y el foco vuelve al botón que lo abrió.
 */
export function PanelRegistro({ abierto, titulo, alCerrar, children }) {
  const t = useT();
  const esEscritorio = useEsEscritorio();
  const origenFoco = useRef(null);

  // El origen es el último elemento enfocado fuera del panel: un campo con autoFocus roba el foco antes de que
  // este componente pueda leer document.activeElement, así que se sigue el foco mientras el panel está cerrado.
  useEffect(() => {
    const alEnfocar = (evento) => {
      if (!evento.target.closest?.('[role="dialog"]')) origenFoco.current = evento.target;
    };
    document.addEventListener('focusin', alEnfocar);
    return () => document.removeEventListener('focusin', alEnfocar);
  }, []);

  useEffect(() => {
    if (!abierto) return undefined;
    const alTeclear = (evento) => evento.key === 'Escape' && alCerrar();
    document.addEventListener('keydown', alTeclear);
    return () => {
      document.removeEventListener('keydown', alTeclear);
      origenFoco.current?.focus?.();
    };
  }, [abierto, alCerrar]);

  if (!abierto) return null;

  const variante = esEscritorio ? 'panel-lateral' : 'pantalla-completa';
  const posicion = esEscritorio
    ? 'inset-y-0 right-0 z-40 w-[420px] border-l border-filete shadow-flota'
    : 'inset-0 z-50';

  return (
    <section
      role="dialog"
      aria-modal={esEscritorio ? 'false' : 'true'}
      aria-labelledby="titulo-panel-registro"
      data-variante={variante}
      className={`fixed ${posicion} flex flex-col overflow-y-auto bg-hoja`}
    >
      <header className="flex items-center justify-between border-b border-filete px-4 py-3">
        <h2 id="titulo-panel-registro" className="text-lg font-semibold leading-[1.35]">
          {titulo}
        </h2>
        <button
          type="button"
          onClick={alCerrar}
          aria-label={t('Cerrar')}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-control text-tinta-suave hover:bg-papel"
        >
          <X aria-hidden="true" size={22} />
        </button>
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}
