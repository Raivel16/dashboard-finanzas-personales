# Spec Delta

## ADDED Requirements

### Requirement: Mantener el saldo de la cuenta consistente
El sistema SHALL actualizar el saldo con cada movimiento registrado, editado o eliminado y MUST garantizar que siempre sea igual al saldo inicial más los ingresos menos los gastos, mostrando el saldo que dejó cada movimiento.

Origen: HU-26 (ver `docs/historias-de-usuario.md`).

#### Scenario: Saldo coherente tras varias operaciones
- **GIVEN** la cuenta "Efectivo" tiene saldo inicial 100.00
- **WHEN** el usuario registra un ingreso de 50.00, un gasto de 30.00 y luego elimina el ingreso
- **THEN** el saldo de la cuenta es 70.00

#### Scenario: Saldo resultante en el historial
- **GIVEN** la cuenta "Efectivo" tiene varios movimientos
- **WHEN** el usuario consulta su historial
- **THEN** cada movimiento muestra el saldo que dejó en su cuenta, calculado por fecha y orden de registro, aunque existan filtros aplicados

#### Scenario: Registro interrumpido no altera el saldo
- **GIVEN** la cuenta "Efectivo" tiene saldo 70.00
- **WHEN** se pierde la conexión mientras el usuario registra un gasto de 20.00
- **THEN** el gasto queda registrado con saldo 50.00 o no queda registrado y el saldo sigue en 70.00; nunca se registra sin descontarse

#### Scenario: Movimiento registrado con fecha anterior
- **GIVEN** la cuenta tiene movimientos hasta el 15/11/2026
- **WHEN** el usuario registra un gasto con fecha 10/11/2026
- **THEN** el sistema recalcula el saldo que dejó cada movimiento posterior y el saldo final es correcto

### Requirement: Validar la coherencia del movimiento
El sistema SHALL asignar al movimiento la moneda de su cuenta y MUST rechazar categorías de otro tipo, cuentas o categorías ajenas, fechas futuras y valores fuera de las reglas de validación comunes.

Origen: HU-27 (ver `docs/historias-de-usuario.md`).

#### Scenario: Movimiento registrado en la moneda de su cuenta
- **GIVEN** el usuario tiene la cuenta "Ahorros USD" en "USD"
- **WHEN** registra un gasto de 40.00 en esa cuenta
- **THEN** el movimiento queda en "USD" y el saldo de la cuenta disminuye en 40.00

#### Scenario: Cambio de cuenta al editar un movimiento
- **GIVEN** existe un gasto de 40.00 en "Ahorros USD"
- **WHEN** el usuario lo asigna a la cuenta "Efectivo" en "PEN"
- **THEN** el movimiento pasa a "PEN", "Ahorros USD" aumenta en 40.00 y "Efectivo" disminuye en 40.00

#### Scenario: Categoría incompatible con el tipo
- **GIVEN** el usuario eligió la categoría de gasto "Alimentación" en el formulario
- **WHEN** cambia el tipo de movimiento a "Ingreso"
- **THEN** el sistema quita la categoría y muestra el mensaje "Selecciona una categoría de ingreso"

#### Scenario: Fecha futura rechazada
- **GIVEN** hoy es 18/11/2026
- **WHEN** el usuario registra un movimiento con fecha 19/11/2026
- **THEN** el sistema lo rechaza con el mensaje "La fecha no puede ser futura"; la fecha de hoy sí se acepta
