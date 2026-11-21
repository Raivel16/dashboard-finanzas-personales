# Spec Delta

## ADDED Requirements

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
