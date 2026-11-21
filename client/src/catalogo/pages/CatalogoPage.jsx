import { Boton } from '../../shared/components/Boton.jsx';
import { Campo } from '../../shared/components/Campo.jsx';
import { Monto } from '../../shared/components/Monto.jsx';
import { SelloAsentado } from '../../shared/components/SelloAsentado.jsx';
import { GraficosEjemplo } from '../components/GraficosEjemplo.jsx';
import { TablaEjemplo } from '../components/TablaEjemplo.jsx';
import { useCatalogo } from '../hooks/useCatalogo.js';

function Seccion({ titulo, children }) {
  return (
    <section className="flex flex-col gap-3 rounded-superficie border border-filete bg-hoja p-4">
      <h2 className="text-lg font-semibold leading-[1.35]">{titulo}</h2>
      {children}
    </section>
  );
}

/** Catálogo de componentes del sistema visual. Solo se enruta en desarrollo. */
export function CatalogoPage() {
  const { moneda, filas, meses, categorias, notificar, probarConfirmacion } = useCatalogo();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-[650] leading-tight">Catálogo de componentes</h1>

      <Seccion titulo="Botones">
        <div className="flex flex-wrap gap-3">
          <Boton variante="primario">Asentar</Boton>
          <Boton>Cancelar</Boton>
          <Boton variante="peligro" onClick={probarConfirmacion}>
            Eliminar
          </Boton>
          <Boton disabled>Deshabilitado</Boton>
        </div>
      </Seccion>

      <Seccion titulo="Campos">
        <div className="grid max-w-xl gap-4 sm:grid-cols-2">
          <Campo
            id="demo-nombre"
            etiqueta="Nombre"
            valor=""
            alCambiar={() => {}}
            ayuda="Como lo verás en tu libreta."
          />
          <Campo
            id="demo-error"
            etiqueta="Monto"
            valor="abc"
            alCambiar={() => {}}
            error="Ingresa un monto válido, por ejemplo 125.50."
            inputMode="decimal"
          />
        </div>
      </Seccion>

      <Seccion titulo="Montos y sello">
        <div className="flex flex-wrap items-center gap-6">
          <Monto valor="3200" moneda={moneda} tipo="ingreso" />
          <Monto valor="212.4" moneda={moneda} tipo="gasto" />
          <Monto valor="1887.6" moneda={moneda} />
          <SelloAsentado />
        </div>
      </Seccion>

      <Seccion titulo="Notificaciones">
        <div className="flex flex-wrap gap-3">
          <Boton onClick={() => notificar.exito('Movimiento asentado')}>Éxito</Boton>
          <Boton onClick={() => notificar.error('No se pudo guardar')}>Error</Boton>
          <Boton onClick={() => notificar.atencion('Te acercas al límite del presupuesto')}>Atención</Boton>
        </div>
      </Seccion>

      <Seccion titulo="Tabla de movimientos">
        <TablaEjemplo filas={filas} moneda={moneda} />
      </Seccion>

      <Seccion titulo="Gráficos">
        <GraficosEjemplo meses={meses} categorias={categorias} moneda={moneda} />
      </Seccion>
    </div>
  );
}
