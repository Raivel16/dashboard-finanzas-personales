import { EstadoSistema } from '../components/EstadoSistema.jsx';
import { useEstadoSistema } from '../hooks/useEstadoSistema.js';

export function InicioPage() {
  const { estado, datos, mensaje, reintentar } = useEstadoSistema();
  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-2xl font-[650] leading-tight">Finanzas personales</h1>
      <p className="max-w-[70ch] text-tinta-suave">
        Aquí vivirá tu libreta: cuentas, movimientos y presupuestos. Por ahora se comprueba que el servidor y
        la base de datos responden.
      </p>
      <EstadoSistema estado={estado} datos={datos} mensaje={mensaje} alReintentar={reintentar} />
    </section>
  );
}
