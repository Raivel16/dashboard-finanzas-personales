import { NavLink, Outlet, useMatches } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useEsEscritorio } from '../hooks/useMediaQuery.js';
import { usePanelRegistro } from '../hooks/usePanelRegistro.js';
import { PanelRegistro } from './PanelRegistro.jsx';

const claseEnlaceLateral = ({ isActive }) =>
  `flex min-h-11 items-center gap-3 rounded-control px-3 text-base font-medium ${
    isActive ? 'bg-tapa-texto text-tapa' : 'text-tapa-texto hover:bg-white/10'
  }`;

const claseEnlaceInferior = ({ isActive }) =>
  `flex min-h-11 min-w-11 flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium ${
    isActive ? 'text-tapa-texto underline underline-offset-4' : 'text-tapa-texto-suave'
  }`;

function EnlaceDestino({ destino, clase, conIcono = true }) {
  const Icono = destino.icono;
  return (
    <NavLink to={destino.ruta} end={destino.ruta === '/'} className={clase}>
      {conIcono && Icono && <Icono aria-hidden="true" size={22} />}
      <span>{destino.etiqueta}</span>
    </NavLink>
  );
}

/**
 * Armazón de la aplicación (RT-05). Presentación pura: las rutas de navegación y el formulario de
 * registro llegan por props desde el router, así `shared/` no conoce ningún dominio.
 *
 * - Desde 1024 px: barra lateral fija de 232 px.
 * - Por debajo: barra superior con la página actual y navegación inferior con "Registrar" al centro.
 *
 * Los destinos con `soloAdmin` solo se muestran si `esAdmin` es true (el servidor vuelve a validar el rol).
 * `menuUsuario(compacto)` pinta los datos de la persona y "Cerrar sesión": en la barra lateral (escritorio)
 * o en la barra superior (celular, `compacto = true`).
 *
 * @param {{ ruta: string, etiqueta: string, icono?: Function, soloAdmin?: boolean }[]} destinos
 * @param {{ etiqueta: string, titulo: string, contenido: (cerrar: () => void) => React.ReactNode } | undefined} registrar
 */
export function AppLayout({ destinos: todos, registrar, esAdmin = false, menuUsuario }) {
  const panel = usePanelRegistro();
  const escritorio = useEsEscritorio();
  const destinos = todos.filter((d) => !d.soloAdmin || esAdmin);
  const coincidencias = useMatches();
  const titulo =
    [...coincidencias].reverse().find((m) => m.handle?.titulo)?.handle.titulo ?? 'Finanzas personales';

  const mitad = Math.ceil(destinos.length / 2);
  const izquierda = registrar ? destinos.slice(0, mitad) : destinos;
  const derecha = registrar ? destinos.slice(mitad) : [];

  return (
    <div className="min-h-dvh lg:pl-[232px]">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[60] focus:rounded-control focus:bg-hoja focus:px-3 focus:py-2"
      >
        Saltar al contenido
      </a>

      {/* Barra lateral (escritorio) */}
      <aside className="sobre-tapa fixed inset-y-0 left-0 hidden w-[232px] flex-col gap-6 bg-tapa p-4 lg:flex">
        <p className="px-3 pt-2 text-lg font-semibold text-tapa-texto">Finanzas personales</p>
        <nav aria-label="Principal" className="flex flex-col gap-1">
          {destinos.map((d) => (
            <EnlaceDestino key={d.ruta} destino={d} clase={claseEnlaceLateral} />
          ))}
        </nav>
        {registrar && (
          <button
            type="button"
            onClick={panel.abrir}
            className="mt-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-control border border-sello bg-sello px-4 text-base font-semibold text-hoja hover:bg-sello-oscuro"
          >
            <Plus aria-hidden="true" size={20} />
            {registrar.etiqueta}
          </button>
        )}
        {escritorio && menuUsuario && <div className={registrar ? '' : 'mt-auto'}>{menuUsuario(false)}</div>}
      </aside>

      {/* Barra superior (celular) */}
      <header className="sobre-tapa sticky top-0 z-30 flex min-h-14 items-center bg-tapa px-4 lg:hidden">
        <p className="text-lg font-semibold text-tapa-texto">{titulo}</p>
        {!escritorio && menuUsuario && <div className="ml-auto">{menuUsuario(true)}</div>}
      </header>

      <main id="contenido" className="mx-auto max-w-[1280px] p-4 pb-24 sm:p-6 lg:p-8">
        <Outlet />
      </main>

      {/* Navegación inferior (celular) */}
      <nav
        aria-label="Principal"
        className="sobre-tapa fixed inset-x-0 bottom-0 z-30 flex items-stretch bg-tapa px-2 pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        {izquierda.map((d) => (
          <EnlaceDestino key={d.ruta} destino={d} clase={claseEnlaceInferior} />
        ))}
        {registrar && (
          <div className="flex flex-1 items-center justify-center py-1">
            <button
              type="button"
              onClick={panel.abrir}
              className="flex min-h-12 min-w-16 flex-col items-center justify-center gap-0.5 rounded-control bg-sello px-3 text-xs font-semibold text-hoja"
            >
              <Plus aria-hidden="true" size={22} />
              Registrar
            </button>
          </div>
        )}
        {derecha.map((d) => (
          <EnlaceDestino key={d.ruta} destino={d} clase={claseEnlaceInferior} />
        ))}
      </nav>

      {registrar && (
        <PanelRegistro abierto={panel.abierto} titulo={registrar.titulo} alCerrar={panel.cerrar}>
          {registrar.contenido(panel.cerrar)}
        </PanelRegistro>
      )}
    </div>
  );
}
