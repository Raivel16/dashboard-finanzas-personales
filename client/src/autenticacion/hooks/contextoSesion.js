import { createContext, useContext } from 'react';

export const ContextoSesion = createContext(null);

/** Sesión actual: { estado: 'cargando' | 'autenticado' | 'anonimo', usuario, aviso, esAdmin, ... }. */
export function useSesion() {
  const contexto = useContext(ContextoSesion);
  if (!contexto) throw new Error('useSesion debe usarse dentro de <ProveedorSesion>');
  return contexto;
}
