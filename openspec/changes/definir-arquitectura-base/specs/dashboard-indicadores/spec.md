# Spec Delta

## ADDED Requirements

### Requirement: Indicadores y gráficos por moneda
El sistema SHALL calcular los indicadores y gráficos del dashboard solo con los movimientos de la moneda seleccionada, sin convertir ni sumar montos de monedas distintas. Por defecto MUST usar la moneda principal del usuario y permitirle elegir otra moneda en la que tenga cuentas.

Origen: HU-12, HU-13 (ver `docs/historias-de-usuario.md`).

#### Scenario: Dashboard en la moneda principal
- **GIVEN** la moneda principal del usuario es "PEN" y tiene movimientos en "PEN" y en "USD" en el mes en curso
- **WHEN** accede al dashboard
- **THEN** los indicadores y gráficos muestran solo los totales en "PEN" con el símbolo "S/"

#### Scenario: Cambio de moneda en el dashboard
- **GIVEN** el usuario está viendo el dashboard en "PEN"
- **WHEN** selecciona la moneda "USD" en el selector de moneda
- **THEN** el sistema recalcula indicadores y gráficos usando solo los movimientos en "USD" y muestra los montos con el símbolo "$"

#### Scenario: Selector limitado a monedas en uso
- **GIVEN** el usuario solo tiene cuentas en "PEN"
- **WHEN** abre el selector de moneda del dashboard
- **THEN** el sistema muestra únicamente "PEN" como opción disponible
