import { Outlet } from 'react-router-dom';
import { SelectorIdioma } from '../../shared/components/SelectorIdioma.jsx';
import { usePreferencias, useT } from '../../shared/preferencias/traducir.js';

/** Marco de las pantallas sin sesión: una hoja centrada sobre el papel y el selector de idioma (HU-32). */
export function LayoutPublico() {
  const t = useT();
  const { idioma, cambiarPreferencias } = usePreferencias();
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 p-4">
      <header>
        <p className="text-lg font-semibold text-tapa">{t('Finanzas personales')}</p>
      </header>
      <main
        id="contenido"
        className="w-full max-w-[420px] rounded-superficie border border-filete bg-hoja p-6 shadow-flota"
      >
        <Outlet />
      </main>
      <footer>
        <SelectorIdioma idioma={idioma} alCambiar={(valor) => cambiarPreferencias({ idioma: valor })} />
      </footer>
    </div>
  );
}
