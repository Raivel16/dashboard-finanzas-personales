import { ListaUsuarios } from '../components/ListaUsuarios.jsx';
import { useCambioRol } from '../hooks/useCambioRol.js';
import { useUsuarios } from '../hooks/useUsuarios.js';
import { useT } from '../../shared/preferencias/traducir.js';

export function AdministracionPage() {
  const t = useT();
  const usuarios = useUsuarios();
  const { cambiar, enCurso } = useCambioRol({ alCambiar: usuarios.reemplazar });
  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-2xl font-[650] leading-tight">{t('Administración')}</h1>
      <ListaUsuarios {...usuarios} alCambiarRol={cambiar} enCurso={enCurso} />
    </section>
  );
}
