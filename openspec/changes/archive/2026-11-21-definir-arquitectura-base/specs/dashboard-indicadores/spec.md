# Spec Delta

## ADDED Requirements

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
