# Spec Delta

## MODIFIED Requirements

### Requirement: Filtrar movimientos por fecha, categoría y tipo
El sistema SHALL permitir que el usuario filtre su historial de movimientos por rango de fechas, categoría, tipo de movimiento, cuenta y moneda, de forma combinable.

Origen: HU-11 (ver `docs/historias-de-usuario.md`).

#### Scenario: Filtrado exitoso por fecha y categoría
- **GIVEN** el usuario se encuentra en el historial de movimientos con múltiples registros
- **WHEN** define un rango de fechas del 01/08/2026 al 31/08/2026 y selecciona la categoría "Alimentación"
- **THEN** el sistema muestra únicamente los movimientos que cumplen simultáneamente ambos criterios de filtrado

#### Scenario: Combinación exitosa de filtros
- **GIVEN** el usuario ha aplicado un filtro por tipo "Ingreso"
- **WHEN** decide combinarlo adicionalmente con el filtro de cuenta "Cuenta Bancaria"
- **THEN** el sistema actualiza el listado mostrando solo los ingresos registrados en dicha cuenta

#### Scenario: Filtro rechazado por rango de fechas inválido
- **GIVEN** el usuario está configurando el filtro de rango de fechas
- **WHEN** ingresa una fecha de inicio posterior a la fecha de fin
- **THEN** el sistema muestra la alerta "La fecha inicial no puede ser mayor a la fecha final" y deshabilita el botón "Aplicar filtros"

#### Scenario: Resultado vacío por filtros sin coincidencias
- **GIVEN** el usuario aplica un conjunto de filtros que no coincide con ningún movimiento registrado
- **WHEN** el sistema ejecuta la búsqueda
- **THEN** se muestra el mensaje "No se encontraron movimientos con los filtros seleccionados" junto con la opción de "Limpiar filtros"

#### Scenario: Filtrado por moneda
- **GIVEN** el usuario tiene movimientos en "PEN" y en "USD"
- **WHEN** aplica el filtro de moneda "USD"
- **THEN** el sistema muestra únicamente los movimientos registrados en cuentas en "USD"
