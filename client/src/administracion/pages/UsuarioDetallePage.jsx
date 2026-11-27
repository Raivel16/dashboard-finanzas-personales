import { useParams } from 'react-router-dom';
import { useCategoriasDeUsuario } from '../../categorias/index.js';
import { useCuentasDeUsuario } from '../../cuentas/index.js';
import { useMovimientosDeUsuario } from '../../movimientos/index.js';
import { usePresupuestosDeUsuario } from '../../presupuestos/index.js';
import { DetalleUsuario } from '../components/DetalleUsuario.jsx';
import { useDetalleUsuario } from '../hooks/useDetalleUsuario.js';
import { useT } from '../../shared/preferencias/traducir.js';

export function UsuarioDetallePage() {
  const t = useT();
  const { id } = useParams();
  const detalle = useDetalleUsuario(id);
  const categorias = useCategoriasDeUsuario(id);
  const cuentas = useCuentasDeUsuario(id);
  const movimientos = useMovimientosDeUsuario(id);
  const presupuestos = usePresupuestosDeUsuario(id);
  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-2xl font-[650] leading-tight">{t('Datos del usuario')}</h1>
      <DetalleUsuario {...detalle} categorias={categorias} cuentas={cuentas} movimientos={movimientos} presupuestos={presupuestos} />
    </section>
  );
}
