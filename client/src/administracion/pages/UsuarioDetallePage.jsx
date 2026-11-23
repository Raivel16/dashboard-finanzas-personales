import { useParams } from 'react-router-dom';
import { useCategoriasDeUsuario } from '../../categorias/index.js';
import { DetalleUsuario } from '../components/DetalleUsuario.jsx';
import { useDetalleUsuario } from '../hooks/useDetalleUsuario.js';

export function UsuarioDetallePage() {
  const { id } = useParams();
  const detalle = useDetalleUsuario(id);
  const categorias = useCategoriasDeUsuario(id);
  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-2xl font-[650] leading-tight">Datos del usuario</h1>
      <DetalleUsuario {...detalle} categorias={categorias} />
    </section>
  );
}
