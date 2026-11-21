// Único lugar donde se declaran las rutas. Cada dominio expone su página por su index.js.
import { createBrowserRouter, createMemoryRouter, Outlet } from 'react-router-dom';
import { Home, LayoutGrid, UserRound } from 'lucide-react';
import { InicioPage } from '../inicio/index.js';
import { CatalogoPage, FormularioDemo, useFormularioDemo } from '../catalogo/index.js';
import {
  InicioSesionPage,
  LayoutAutenticado,
  LayoutPublico,
  OlvideContrasenaPage,
  ProveedorSesion,
  RegistroPage,
  RestablecerContrasenaPage,
  RutaProtegida,
  RutaPublica,
} from '../autenticacion/index.js';
import { PerfilPage } from '../perfil/index.js';
import { PaginaNoEncontrada } from '../shared/components/PaginaNoEncontrada.jsx';

function FormularioRegistroDemo({ cerrar }) {
  const formulario = useFormularioDemo({});
  return <FormularioDemo formulario={formulario} alCerrar={cerrar} />;
}

const REGISTRAR_DEMO = {
  etiqueta: 'Registrar',
  titulo: 'Nuevo registro',
  contenido: (cerrar) => <FormularioRegistroDemo cerrar={cerrar} />,
};

/** La sesión vive por encima de todas las rutas: las públicas y las protegidas la comparten. */
const RaizSesion = () => (
  <ProveedorSesion>
    <Outlet />
  </ProveedorSesion>
);

/** Los destinos de navegación crecerán con cada dominio; el catálogo solo existe en desarrollo. */
export function crearRutas({ desarrollo = import.meta.env.DEV } = {}) {
  const destinos = [{ ruta: '/', etiqueta: 'Inicio', icono: Home }];
  const hijas = [{ index: true, element: <InicioPage />, handle: { titulo: 'Inicio' } }];

  destinos.push({ ruta: '/perfil', etiqueta: 'Mi perfil', icono: UserRound });
  hijas.push({ path: 'perfil', element: <PerfilPage />, handle: { titulo: 'Mi perfil' } });

  if (desarrollo) {
    destinos.push({ ruta: '/catalogo', etiqueta: 'Catálogo', icono: LayoutGrid });
    hijas.push({ path: 'catalogo', element: <CatalogoPage />, handle: { titulo: 'Catálogo' } });
  }
  hijas.push({ path: '*', element: <PaginaNoEncontrada />, handle: { titulo: 'No encontrada' } });

  return [
    {
      element: <RaizSesion />,
      children: [
        {
          element: <RutaPublica />,
          children: [
            {
              element: <LayoutPublico />,
              children: [
                { path: '/registro', element: <RegistroPage /> },
                { path: '/iniciar-sesion', element: <InicioSesionPage /> },
                { path: '/olvide-contrasena', element: <OlvideContrasenaPage /> },
              ],
            },
          ],
        },
        // El enlace de recuperación debe abrirse con o sin sesión iniciada.
        {
          element: <LayoutPublico />,
          children: [{ path: '/restablecer-contrasena', element: <RestablecerContrasenaPage /> }],
        },
        {
          element: <RutaProtegida />,
          children: [
            {
              path: '/',
              element: (
                <LayoutAutenticado destinos={destinos} registrar={desarrollo ? REGISTRAR_DEMO : undefined} />
              ),
              children: hijas,
            },
          ],
        },
      ],
    },
  ];
}

export const crearRouterNavegador = (opciones) => createBrowserRouter(crearRutas(opciones));

export const crearRouterMemoria = (rutaInicial = '/', opciones) =>
  createMemoryRouter(crearRutas(opciones), { initialEntries: [rutaInicial] });
