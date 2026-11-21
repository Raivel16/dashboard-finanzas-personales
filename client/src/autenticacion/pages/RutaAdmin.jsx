import { Outlet } from 'react-router-dom';
import { AccesoNoAutorizado } from '../../shared/components/AccesoNoAutorizado.jsx';
import { useSesion } from '../hooks/contextoSesion.js';

/**
 * Solo para administradores. Esto no es la defensa: la API vuelve a validar el rol en cada solicitud;
 * aquí solo se evita mostrar pantallas que la API rechazaría.
 */
export function RutaAdmin() {
  const { esAdmin } = useSesion();
  return esAdmin ? <Outlet /> : <AccesoNoAutorizado />;
}
