import { FormularioContrasena } from '../components/FormularioContrasena.jsx';
import { FormularioPerfil } from '../components/FormularioPerfil.jsx';
import { PreferenciasPerfil } from '../components/PreferenciasPerfil.jsx';
import { useCambiarContrasena } from '../hooks/useCambiarContrasena.js';
import { usePerfil } from '../hooks/usePerfil.js';
import { usePreferenciasPerfil } from '../hooks/usePreferenciasPerfil.js';
import { useT } from '../../shared/preferencias/traducir.js';

export function PerfilPage() {
  const perfil = usePerfil();
  const contrasena = useCambiarContrasena();
  const preferencias = usePreferenciasPerfil();
  const t = useT();
  return (
    <section className="flex flex-col gap-8">
      <h1 className="text-2xl font-[650] leading-tight">{t('Mi perfil')}</h1>
      <FormularioPerfil {...perfil} />
      <PreferenciasPerfil {...preferencias} />
      <FormularioContrasena {...contrasena} />
    </section>
  );
}
