// Único lugar donde se declaran las rutas. Cada dominio expone su página por su index.js.
import { createBrowserRouter, createMemoryRouter } from 'react-router-dom';
import { Home, LayoutGrid } from 'lucide-react';
import { InicioPage } from '../inicio/index.js';
import { CatalogoPage, FormularioDemo, useFormularioDemo } from '../catalogo/index.js';
import { AppLayout } from '../shared/components/AppLayout.jsx';
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

/** Los destinos de navegación crecerán con cada dominio; el catálogo solo existe en desarrollo. */
export function crearRutas({ desarrollo = import.meta.env.DEV } = {}) {
  const destinos = [{ ruta: '/', etiqueta: 'Inicio', icono: Home }];
  const hijas = [{ index: true, element: <InicioPage />, handle: { titulo: 'Inicio' } }];

  if (desarrollo) {
    destinos.push({ ruta: '/catalogo', etiqueta: 'Catálogo', icono: LayoutGrid });
    hijas.push({ path: 'catalogo', element: <CatalogoPage />, handle: { titulo: 'Catálogo' } });
  }
  hijas.push({ path: '*', element: <PaginaNoEncontrada />, handle: { titulo: 'No encontrada' } });

  return [
    {
      path: '/',
      element: <AppLayout destinos={destinos} registrar={desarrollo ? REGISTRAR_DEMO : undefined} />,
      children: hijas,
    },
  ];
}

export const crearRouterNavegador = (opciones) => createBrowserRouter(crearRutas(opciones));

export const crearRouterMemoria = (rutaInicial = '/', opciones) =>
  createMemoryRouter(crearRutas(opciones), { initialEntries: [rutaInicial] });
