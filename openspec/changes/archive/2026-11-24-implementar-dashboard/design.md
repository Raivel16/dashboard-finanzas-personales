# Design

## Context

Los requisitos están en `openspec/specs/dashboard-indicadores/spec.md`; el motivo y el alcance, en `proposal.md`. Ya existen los movimientos con su moneda, los presupuestos con `avance` y `porcentajeUsado` (`server/src/utils/presupuesto.js`), `monedaPrincipal` del usuario, el tema de Chart.js (`client/src/shared/utils/graficos.js` y los colores validados `COLORES_GRAFICO` de `tokens.js`) y la pantalla de inicio con el estado del sistema. El diseño base fija que el dashboard siempre agrega por moneda y arranca en la moneda principal.

## Goals / Non-Goals

**Goals:**

- Que cada escenario de HU-12, HU-13 y HU-28 tenga una prueba automatizada que pase, en la API y en la pantalla.
- Que los montos se sumen en el servidor con agregaciones y `decimal.js`, nunca con `Number`, y que los gráficos usen los colores y tooltips de `DESIGN.md`.

**Non-Goals:**

- Conversión de monedas, rangos libres, comparar períodos y exportar (épica 9).

## Decisions

### 1. Tres consultas de solo lectura

Todas con sesión obligatoria y filtradas por `tenantId`:

| Ruta | Respuesta |
|---|---|
| `GET /dashboard/monedas` | `{ principal, monedas }`: las monedas de las cuentas de la persona, o solo su moneda principal si aún no tiene cuentas. |
| `GET /dashboard/indicadores?periodo=&moneda=` | `{ periodo, moneda, ingresos, gastos, balance, hayMovimientos, presupuesto }`; `presupuesto` es el avance del presupuesto general del mes y la moneda (`monto`, `gastado`, `porcentaje`, `restante`, `excedido`, `sobregiro`) o `null` si no hay. |
| `GET /dashboard/graficos?periodo=&moneda=` | `{ evolucion, distribucion }`: `evolucion` son los 6 meses que terminan en `periodo` (`periodo`, `ingresos`, `gastos`, con ceros en los meses sin movimientos) y `distribucion` los gastos del mes por categoría (`categoriaId`, `nombre`, `total`, `porcentaje`), con las ocho mayores y el resto agrupado en "Otras". |

`periodo` por defecto es el mes actual y `moneda` la principal del usuario; se validan con los esquemas de `shared/` (`AAAA-MM`, PEN/USD/EUR). Separar indicadores y gráficos cumple que el error de unos no rompa los otros.

### 2. Agregaciones

`movimiento.repository` agrega `totalesDelMes(periodo, moneda)` (ingresos y gastos), `evolucionMensual(desde, hasta, moneda)` y reutiliza `gastoDelMesPorCategoria`. Todas pasan por `agregar`, que antepone el `$match` por `tenantId`. Balance = ingresos − gastos, con `decimal.js`; los porcentajes de la distribución se redondean a un decimal y el de presupuesto reutiliza `avance`. Los montos viajan como texto con dos decimales.

### 3. Pantalla

El dominio `dashboard/` tiene `useDashboard` (mes, moneda y las dos cargas independientes), las tarjetas, `GraficoEvolucion` (barras agrupadas de ingresos y gastos) y `GraficoDistribucion` (circular), con `react-chartjs-2` y el tema ya aplicado. El selector de mes usa `Campo` de tipo `month` y el de moneda `Selector`. Cada gráfico lleva su título, su leyenda, un tooltip con nombre, monto y porcentaje y una vista de tabla (`details`) con los mismos datos para quien no puede usar el gráfico. La pantalla de inicio muestra el dashboard debajo del título "Finanzas personales" y deja el estado del sistema como una línea al pie.

### 4. Estados

- Indicadores con error: "No se pudieron cargar los indicadores" y "Reintentar". Si el error ocurre al cambiar de moneda se mantienen visibles los datos de la moneda anterior y el mensaje pasa a "No se pudieron cargar los indicadores en USD" con reintento (el selector vuelve a la moneda mostrada solo al reintentar o elegir otra).
- Sin movimientos en el período: los valores en cero (S/ 0.00) y un mensaje motivacional.
- Gráficos con error: "No se pudieron generar los gráficos en este momento" en el espacio del gráfico, sin afectar las tarjetas.
- Sin gastos: "No hay gastos registrados en este período" en lugar del gráfico circular; la evolución sigue mostrándose.
- Presupuesto utilizado: porcentaje con barra de progreso (la de `presupuestos`) o "Sin presupuesto" con acceso directo a "Presupuestos".

### 5. Pruebas

El servidor se prueba por la API con movimientos reales. En el cliente `react-chartjs-2` se simula con componentes que exponen sus datos (jsdom no tiene canvas); los tooltips se comprueban con la función de etiqueta que se entrega a Chart.js.

## Risks / Trade-offs

- [Los gráficos no se pueden renderizar en jsdom] → Las pruebas comprueban los datos y las opciones que se entregan a Chart.js, y la tabla equivalente; la verificación visual se hace en el navegador.
- [Sin conversión de monedas la persona no ve un total consolidado] → Es una decisión del diseño base; el selector deja claro en qué moneda se muestran los datos.
- [Dos consultas por pantalla] → Es lo que permite errores independientes; el volumen personal lo permite.
