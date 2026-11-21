import { FormularioContrasena } from '../components/FormularioContrasena.jsx';
import { FormularioPerfil } from '../components/FormularioPerfil.jsx';
import { useCambiarContrasena } from '../hooks/useCambiarContrasena.js';
import { usePerfil } from '../hooks/usePerfil.js';

export function PerfilPage() {
  const perfil = usePerfil();
  const contrasena = useCambiarContrasena();
  return (
    <section className="flex flex-col gap-8">
      <h1 className="text-2xl font-[650] leading-tight">Mi perfil</h1>
      <FormularioPerfil {...perfil} />
      <FormularioContrasena {...contrasena} />
    </section>
  );
}
