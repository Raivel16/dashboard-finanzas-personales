# gestion-cuentas Specification

## Purpose
Permitir que cada usuario administre sus cuentas y medios de pago (efectivo, cuenta bancaria, tarjeta de crédito, billetera digital) para asociar cada movimiento al origen o destino real del dinero.

Épica de origen: Gestión de Cuentas y Medios de Pago (HU-07).

## Requirements

### Requirement: Administrar cuentas o medios de pago
El sistema SHALL permitir que el usuario registre, edite, liste y elimine sus cuentas o medios de pago, sin eliminar cuentas con movimientos asociados.

Origen: HU-07 (ver `docs/historias-de-usuario.md`).

#### Scenario: Registro exitoso de una cuenta o medio de pago
- **GIVEN** el usuario se encuentra en la sección "Cuentas" del dashboard
- **WHEN** registra una nueva cuenta de tipo "Tarjeta de crédito" con nombre "Visa Principal" y saldo inicial de 0
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

### Requirement: Definir moneda y saldo inicial de la cuenta
El sistema SHALL exigir una moneda soportada (PEN, USD o EUR) y un saldo inicial para cada cuenta. El saldo inicial MAY ser negativo y corregirse; la moneda MUST quedar fija cuando la cuenta tenga movimientos.

Origen: HU-25 (ver `docs/historias-de-usuario.md`).

#### Scenario: Cuenta creada en otra moneda
- **GIVEN** el usuario registra una cuenta
- **WHEN** elige la moneda "USD" y un saldo inicial de 200.00
- **THEN** el sistema crea la cuenta en "USD" y muestra su saldo con el símbolo "$"

#### Scenario: Corrección del saldo inicial
- **GIVEN** una cuenta con movimientos tiene saldo inicial 100.00 y saldo actual 70.00
- **WHEN** el usuario corrige el saldo inicial a 120.00
- **THEN** el saldo actual pasa a 90.00 y los movimientos no cambian

#### Scenario: Moneda no seleccionada
- **GIVEN** el usuario registra una nueva cuenta
- **WHEN** no selecciona ninguna moneda y presiona "Guardar"
- **THEN** el sistema bloquea el guardado y muestra el mensaje "La moneda es obligatoria"

#### Scenario: Cambio de moneda impedido en una cuenta con movimientos
- **GIVEN** el usuario posee una cuenta "Ahorros" en "USD" con movimientos
- **WHEN** intenta cambiar su moneda a "PEN"
- **THEN** el sistema rechaza el cambio y muestra el mensaje "No se puede cambiar la moneda de una cuenta con movimientos asociados"
