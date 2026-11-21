# dashboard-indicadores Specification

## Purpose
Ofrecer al usuario una visión rápida de su situación financiera mediante indicadores clave y gráficos interactivos.

Épica de origen: Dashboard e Indicadores Financieros (HU-12, HU-13).

## Requirements

### Requirement: Visualizar indicadores financieros en el dashboard
El sistema SHALL mostrar en el dashboard los indicadores clave del período seleccionado: total de ingresos, total de gastos, balance neto y porcentaje de presupuesto utilizado.

Origen: HU-12 (ver `docs/historias-de-usuario.md`).

#### Scenario: Visualización exitosa de indicadores del período actual
- **GIVEN** el usuario tiene movimientos registrados en el mes en curso
- **WHEN** accede a la pantalla principal del dashboard
- **THEN** el sistema calcula y muestra en tarjetas resumen el total de ingresos, total de gastos, balance neto y porcentaje de presupuesto utilizado del mes actual

#### Scenario: Actualización de indicadores al cambiar el período
- **GIVEN** el usuario se encuentra en el dashboard
- **WHEN** cambia el período de análisis a un mes anterior mediante el selector de fecha
- **THEN** el sistema recalcula y actualiza todos los indicadores mostrados conforme al período seleccionado

#### Scenario: Error controlado al cargar indicadores
- **GIVEN** ocurre una falla temporal en la conexión con la API REST al calcular los indicadores
- **WHEN** el usuario carga el dashboard
- **THEN** el sistema muestra un estado de error controlado con el mensaje "No se pudieron cargar los indicadores" y un botón para reintentar, sin romper la interfaz

#### Scenario: Indicadores en cero cuando no existen movimientos
- **GIVEN** el usuario no ha registrado ningún movimiento en el período seleccionado
- **WHEN** el dashboard calcula los indicadores
- **THEN** el sistema muestra todos los valores en cero (S/ 0.00) y un mensaje motivacional indicando que aún no existen movimientos para ese período

### Requirement: Visualizar gráficos financieros interactivos
El sistema SHALL mostrar gráficos interactivos de la evolución de ingresos y gastos y de la distribución de gastos por categoría.

Origen: HU-13 (ver `docs/historias-de-usuario.md`).

#### Scenario: Visualización exitosa de gráficos financieros
- **GIVEN** el usuario tiene movimientos registrados en los últimos 6 meses
- **WHEN** accede a la sección de gráficos del dashboard
- **THEN** el sistema renderiza mediante Chart.js un gráfico de líneas o barras con la evolución de ingresos y gastos, y un gráfico circular con la distribución de gastos por categoría

#### Scenario: Consulta de detalles mediante tooltip interactivo
- **GIVEN** el usuario está visualizando el gráfico de distribución de gastos por categoría
- **WHEN** posiciona el cursor sobre uno de los segmentos del gráfico
- **THEN** el sistema muestra un tooltip interactivo con el nombre de la categoría, el monto exacto y el porcentaje que representa sobre el total

#### Scenario: Error controlado al generar gráficos
- **GIVEN** el usuario intenta cargar los gráficos financieros
- **WHEN** la solicitud a la API REST responde con un error 500
- **THEN** el sistema muestra un mensaje "No se pudieron generar los gráficos en este momento" en el espacio del gráfico, sin afectar el resto del dashboard

#### Scenario: Estado vacío del gráfico sin gastos registrados
- **GIVEN** el usuario solo ha registrado movimientos de tipo "Ingreso" y ningún "Gasto" en el período consultado
- **WHEN** se genera el gráfico de distribución de gastos por categoría
- **THEN** el sistema muestra un estado vacío específico para ese gráfico indicando "No hay gastos registrados en este período" sin generar un gráfico circular vacío o erróneo

### Requirement: Ver el dashboard por moneda
El sistema SHALL calcular indicadores y gráficos solo con los movimientos de la moneda seleccionada, sin conversiones. Por defecto MUST usar la moneda principal del usuario.

Origen: HU-28 (ver `docs/historias-de-usuario.md`).

#### Scenario: Dashboard en la moneda principal
- **GIVEN** la moneda principal es "PEN" y hay movimientos en "PEN" y "USD"
- **WHEN** el usuario accede al dashboard
- **THEN** los indicadores y gráficos muestran solo los totales en "PEN" con el símbolo "S/"

#### Scenario: Cambio de moneda en el dashboard
- **GIVEN** el usuario ve el dashboard en "PEN"
- **WHEN** selecciona "USD"
- **THEN** el sistema recalcula todo usando solo los movimientos en "USD"

#### Scenario: Error al cambiar de moneda
- **GIVEN** el usuario ve el dashboard en "PEN"
- **WHEN** selecciona "USD" y ocurre un error de conexión
- **THEN** el sistema mantiene visibles los datos en "PEN" y muestra el mensaje "No se pudieron cargar los indicadores en USD" con la opción de reintentar

#### Scenario: Selector limitado a las monedas en uso
- **GIVEN** el usuario solo tiene cuentas en "PEN"
- **WHEN** abre el selector de moneda
- **THEN** el sistema muestra únicamente "PEN"; si aún no tiene cuentas, muestra su moneda principal
