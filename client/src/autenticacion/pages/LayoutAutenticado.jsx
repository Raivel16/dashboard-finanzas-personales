import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../../shared/components/AppLayout.jsx';
import { MenuUsuario } from '../components/MenuUsuario.jsx';
import { useSesion } from '../hooks/contextoSesion.js';

/** Armazón de la aplicación con el menú de la persona. Los destinos y el registro los define el router. */
export function LayoutAutenticado({ destinos, registrar }) {
  const { usuario, esAdmin, cerrarSesion } = useSesion();
  const navegar = useNavigate();

  const cerrar = async () => {
    await cerrarSesion();
    navegar('/iniciar-sesion', { replace: true });
  };

  return (
    <AppLayout
      destinos={destinos}
      registrar={registrar}
      esAdmin={esAdmin}
      menuUsuario={(compacto) => (
        <MenuUsuario usuario={usuario} alCerrarSesion={cerrar} compacto={compacto} />
      )}
    />
  );
}
