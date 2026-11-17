# Spec Delta

## MODIFIED Requirements

### Requirement: Administrar cuentas o medios de pago
El sistema SHALL permitir que el usuario registre, edite, liste y elimine sus cuentas o medios de pago, sin eliminar cuentas con movimientos asociados. Cada cuenta MUST tener una moneda (código ISO 4217) elegida al crearla, que no puede cambiarse una vez que la cuenta tiene movimientos.

Origen: HU-07 (ver `docs/historias-de-usuario.md`).

#### Scenario: Registro exitoso de una cuenta o medio de pago
- **GIVEN** el usuario se encuentra en la sección "Cuentas" del dashboard
- **WHEN** registra una nueva cuenta de tipo "Tarjeta de crédito" con nombre "Visa Principal", moneda "PEN" y saldo inicial de 0
- **THEN** el sistema crea la cuenta vinculada a su userId y la muestra disponible como origen/destino al registrar movimientos

#### Scenario: Edición exitosa de una cuenta existente
- **GIVEN** el usuario posee una cuenta "Efectivo" registrada
- **WHEN** edita el nombre de la cuenta a "Efectivo Personal" y guarda los cambios
- **THEN** el sistema actualiza el nombre y mantiene intacto el historial de movimientos asociados a dicha cuenta

#### Scenario: Registro rechazado por nombre de cuenta vacío
- **GIVEN** el usuario intenta registrar una nueva cuenta
- **WHEN** deja el campo "Nombre de la cuenta" vacío y presiona "Guardar"
- **THEN** el sistema bloquea el envío del formulario y muestra el mensaje "El nombre de la cuenta es obligatorio"

#### Scenario: Eliminación impedida por movimientos asociados
- **GIVEN** el usuario intenta eliminar una cuenta que posee movimientos financieros registrados
- **WHEN** confirma la acción de eliminación
- **THEN** el sistema impide la eliminación y muestra la advertencia "No se puede eliminar una cuenta con movimientos asociados"

#### Scenario: Cambio de moneda impedido en una cuenta con movimientos
- **GIVEN** el usuario posee una cuenta "Ahorros" en moneda "USD" con movimientos registrados
- **WHEN** intenta cambiar su moneda a "PEN"
- **THEN** el sistema rechaza el cambio y muestra el mensaje "No se puede cambiar la moneda de una cuenta con movimientos asociados"

## ADDED Requirements

### Requirement: Consistencia del saldo de la cuenta
El sistema SHALL actualizar el saldo de la cuenta con cada movimiento registrado, editado o eliminado, y MUST garantizar que el saldo mostrado coincida siempre con el saldo inicial más la suma de los ingresos menos la suma de los gastos de esa cuenta. Si detecta una diferencia, MUST corregir el saldo al valor calculado y registrar la inconsistencia.

Origen: HU-07, HU-08, HU-09 (ver `docs/historias-de-usuario.md`).

#### Scenario: Saldo coherente tras varias operaciones
- **GIVEN** la cuenta "Efectivo" tiene saldo inicial 100.00
- **WHEN** el usuario registra un ingreso de 50.00, un gasto de 30.00 y luego elimina el ingreso
- **THEN** el saldo de la cuenta es 70.00, igual a 100.00 + 0.00 − 30.00

#### Scenario: Operación fallida no altera el saldo
- **GIVEN** la cuenta "Efectivo" tiene saldo 70.00
- **WHEN** el registro de un nuevo gasto de 20.00 falla antes de completarse
- **THEN** ni el movimiento ni el cambio de saldo quedan guardados y el saldo sigue siendo 70.00

#### Scenario: Corrección de un saldo inconsistente
- **GIVEN** el saldo almacenado de una cuenta difiere de la suma calculada a partir de sus movimientos
- **WHEN** el sistema verifica el saldo de esa cuenta
- **THEN** el sistema reemplaza el saldo por el valor calculado y registra la inconsistencia para su revisión
