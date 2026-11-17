# Spec Delta

## ADDED Requirements

### Requirement: Presupuesto por moneda
El sistema SHALL asociar cada presupuesto mensual (general o por categoría) a una moneda, y MUST medir su cumplimiento solo con los gastos registrados en esa moneda durante el mes. Un usuario puede tener un presupuesto distinto para cada moneda en el mismo mes.

Origen: HU-14, HU-15 (ver `docs/historias-de-usuario.md`).

#### Scenario: Presupuestos independientes por moneda
- **GIVEN** el usuario definió para el mes en curso un presupuesto de 1500.00 PEN y otro de 200.00 USD
- **WHEN** registra un gasto de 50.00 USD
- **THEN** el avance del presupuesto en USD sube a 25 % y el del presupuesto en PEN no cambia

#### Scenario: Gastos en otra moneda no cuentan para el presupuesto
- **GIVEN** el usuario solo tiene un presupuesto de 1500.00 PEN para el mes en curso
- **WHEN** registra gastos por 300.00 USD
- **THEN** el porcentaje utilizado del presupuesto en PEN no cambia
