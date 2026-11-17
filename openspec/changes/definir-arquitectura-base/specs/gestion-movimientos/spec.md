# Spec Delta

## ADDED Requirements

### Requirement: Coherencia de moneda y categoría del movimiento
El sistema SHALL asignar a cada movimiento la moneda de la cuenta seleccionada, sin permitir que el usuario indique otra, y MUST rechazar un movimiento cuya categoría no corresponda a su tipo (una categoría de gasto solo se usa en gastos y una de ingreso solo en ingresos).

Origen: HU-08, HU-09 (ver `docs/historias-de-usuario.md`).

#### Scenario: Movimiento registrado en la moneda de su cuenta
- **GIVEN** el usuario tiene la cuenta "Ahorros USD" en moneda "USD"
- **WHEN** registra un gasto de 40.00 en esa cuenta
- **THEN** el movimiento queda registrado en "USD" y el saldo de "Ahorros USD" disminuye en 40.00 USD

#### Scenario: Cambio de cuenta al editar un movimiento
- **GIVEN** el usuario tiene un gasto de 40.00 registrado en la cuenta "Ahorros USD"
- **WHEN** lo edita para asignarlo a la cuenta "Efectivo" en moneda "PEN"
- **THEN** el movimiento pasa a estar en "PEN", el saldo de "Ahorros USD" aumenta en 40.00 y el de "Efectivo" disminuye en 40.00

#### Scenario: Categoría incompatible con el tipo
- **GIVEN** el usuario completa el formulario "Nuevo movimiento" con tipo "Ingreso"
- **WHEN** envía a la API la categoría de gasto "Alimentación"
- **THEN** el sistema rechaza el registro con el mensaje "La categoría no corresponde al tipo de movimiento"
