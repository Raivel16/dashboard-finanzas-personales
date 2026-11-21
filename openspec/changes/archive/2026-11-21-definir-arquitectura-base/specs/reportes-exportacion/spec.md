# Spec Delta

## ADDED Requirements

### Requirement: Exportar reportes separados por moneda
El sistema SHALL incluir la moneda de cada movimiento en los reportes y presentar totales separados por moneda, usando solo datos del usuario autenticado y un máximo de 5000 movimientos por archivo.

Origen: HU-31 (ver `docs/historias-de-usuario.md`).

#### Scenario: Reporte Excel con varias monedas
- **GIVEN** existen movimientos en "PEN" y "USD" en el período filtrado
- **WHEN** el usuario exporta a Excel
- **THEN** la hoja "Resumen" muestra los totales por categoría y tipo separados por moneda

#### Scenario: Reporte PDF con totales por moneda
- **GIVEN** existen movimientos en "PEN" y "USD" en el período filtrado
- **WHEN** el usuario exporta a PDF
- **THEN** el documento muestra ingresos, gastos y balance por separado para cada moneda

#### Scenario: Excel que supera el límite
- **GIVEN** los filtros incluyen más de 5000 movimientos
- **WHEN** el usuario exporta a Excel
- **THEN** el sistema no genera el archivo y muestra el mensaje "El reporte supera los 5000 movimientos. Reduce el período o aplica más filtros"

#### Scenario: Reporte aislado por usuario
- **GIVEN** los usuarios A y B tienen movimientos en el mismo período
- **WHEN** el usuario A exporta su reporte
- **THEN** el archivo contiene solo los datos del usuario A
