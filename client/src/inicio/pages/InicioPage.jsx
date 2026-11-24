import { DashboardPage } from '../../dashboard/index.js';
import { EstadoSistema } from '../components/EstadoSistema.jsx';
import { useEstadoSistema } from '../hooks/useEstadoSistema.js';

export function InicioPage() {
  const { estado, datos, mensaje, reintentar } = useEstadoSistema();
  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-2xl font-[650] leading-tight">Finanzas personales</h1>
      <DashboardPage />
      <EstadoSistema estado={estado} datos={datos} mensaje={mensaje} alReintentar={reintentar} />
    </section>
  );
}
