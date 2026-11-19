# Spec Delta

## ADDED Requirements

### Requirement: Definir presupuestos por moneda y período
El sistema SHALL asociar cada presupuesto a una moneda y a un mes, medir su avance solo con gastos de esa moneda y mes, y permitir definirlo solo para el mes actual o meses futuros.

Origen: HU-29 (ver `docs/historias-de-usuario.md`).

#### Scenario: Presupuestos independientes por moneda
- **GIVEN** el usuario tiene presupuestos de 1500.00 PEN y 200.00 USD para el mes
- **WHEN** registra un gasto de 50.00 USD
- **THEN** el avance en USD sube a 25 % y el de PEN no cambia

#### Scenario: Gastos en otra moneda no cuentan
- **GIVEN** el usuario solo tiene un presupuesto de 1500.00 PEN
- **WHEN** registra gastos por 300.00 USD
- **THEN** el porcentaje utilizado en PEN no cambia

#### Scenario: Mes pasado rechazado
- **GIVEN** el usuario define un presupuesto
- **WHEN** selecciona un mes anterior al actual
- **THEN** el sistema lo rechaza con el mensaje "Solo puedes definir presupuestos para el mes actual o meses futuros"; los presupuestos pasados se pueden consultar

#### Scenario: Presupuesto en una moneda sin gastos
- **GIVEN** el usuario definió un presupuesto en "EUR" y no tiene gastos en esa moneda
- **WHEN** consulta su seguimiento
- **THEN** el sistema muestra 0 % utilizado y el monto completo disponible

### Requirement: Mantener los presupuestos por categoría dentro del general
El sistema SHALL exigir un presupuesto general del mismo mes y moneda antes de crear presupuestos por categoría, y MUST impedir que la suma de estos supere al general. Cada presupuesto tiene su propio seguimiento.

Origen: HU-30 (ver `docs/historias-de-usuario.md`).

#### Scenario: Presupuesto por categoría dentro del general
- **GIVEN** el usuario tiene un presupuesto general de 1500.00 PEN y categorías que suman 1000.00
- **WHEN** asigna 300.00 a "Entretenimiento"
- **THEN** el sistema lo guarda y muestra 200.00 sin asignar

#### Scenario: Gasto sin presupuesto de categoría
- **GIVEN** la categoría "Salud" no tiene presupuesto propio
- **WHEN** el usuario registra un gasto en "Salud"
- **THEN** el gasto cuenta para el presupuesto general

#### Scenario: Suma superior al presupuesto general
- **GIVEN** el usuario tiene 200.00 sin asignar
- **WHEN** intenta asignar 300.00 a una categoría
- **THEN** el sistema lo rechaza con el mensaje "La suma por categorías supera el presupuesto general"

#### Scenario: Reducción del general por debajo de lo asignado
- **GIVEN** las categorías suman 1300.00
- **WHEN** el usuario intenta reducir el presupuesto general a 1000.00
- **THEN** el sistema lo rechaza con el mensaje "El presupuesto general no puede ser menor a lo asignado por categorías"
