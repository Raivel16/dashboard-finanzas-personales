# Proposal

## Why

Con cuentas, movimientos y presupuestos ya registrados, falta darle a la persona una visión rápida de su situación: cuánto ingresó y gastó en el mes, cuánto le queda y cómo se reparte su gasto. La séptima épica de `docs/trazabilidad.md` (versión `v0.9.0`) construye el dashboard con indicadores y gráficos interactivos, siempre en una sola moneda porque no hay conversión entre monedas.

## What Changes

- Se implementa el comportamiento **ya especificado** en `dashboard-indicadores`: tarjetas de total de ingresos, total de gastos, balance neto y porcentaje de presupuesto utilizado del período elegido, con estado de error con reintento y valores en cero con mensaje motivacional (HU-12); gráfico de evolución de ingresos y gastos de los últimos 6 meses y gráfico circular de gastos por categoría con Chart.js, con tooltips (nombre, monto y porcentaje), error propio y estado vacío (HU-13); y todo calculado solo con la moneda elegida, por defecto la principal, con selector limitado a las monedas en uso y error que conserva los datos anteriores (HU-28).
- Servidor: nuevo recurso `/api/v1/dashboard` con tres consultas de solo lectura (`monedas`, `indicadores` y `graficos`) calculadas con agregaciones de MongoDB sobre los movimientos del inquilino y `decimal.js` para los porcentajes. Los indicadores y los gráficos son consultas separadas para que el error de unos no afecte a los otros.
- Cliente: nuevo dominio `dashboard/` con las tarjetas, los dos gráficos, el selector de mes y de moneda y una vista de tabla de cada gráfico; la pantalla de inicio pasa a mostrar el dashboard (conserva el estado del sistema como una línea al pie).
- **No cambia ningún requisito ni escenario** (`skip_specs: true`). Fuera de alcance: conversión entre monedas o patrimonio consolidado, rangos de fechas libres, exportar los gráficos (épica 9) y comparar períodos.

## Capabilities

### New Capabilities
<!-- Ninguna: no se introduce comportamiento nuevo. -->

### Modified Capabilities
<!-- Ninguna: los requisitos de dashboard-indicadores no cambian; este cambio solo los implementa. -->

## Impact

- **Servidor**: nuevo recurso `dashboard` en todas las capas; nuevas agregaciones en `movimiento.repository`.
- **Cliente**: nuevo dominio `dashboard/`; `inicio/` lo muestra; las pruebas de gráficos simulan `react-chartjs-2` porque jsdom no tiene canvas.
- **Trazabilidad**: rama `feature/implementar-dashboard`; HU-12, HU-13 y HU-28 hechas al fusionar.
