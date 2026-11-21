# gestion-movimientos Specification

## Purpose
Permitir que el usuario registre, edite y elimine sus movimientos financieros (ingresos y gastos), manteniendo actualizados los saldos de sus cuentas y los indicadores del dashboard.

Épica de origen: Gestión de Transacciones (Movimientos) (HU-08, HU-09).

## Requirements

### Requirement: Registrar movimiento financiero (ingreso o gasto)
El sistema SHALL permitir que el usuario registre un movimiento financiero indicando tipo (ingreso/gasto), monto, categoría, cuenta, fecha y descripción, actualizando el saldo de la cuenta y los indicadores del dashboard.

Origen: HU-08 (ver `docs/historias-de-usuario.md`).

#### Scenario: Registro exitoso de un movimiento financiero
- **GIVEN** el usuario se encuentra en el formulario "Nuevo movimiento" con al menos una categoría y una cuenta previamente registradas
- **WHEN** selecciona el tipo "Gasto", ingresa el monto 150.00, la categoría "Alimentación", la cuenta "Efectivo", la fecha actual y una descripción, y confirma el registro
- **THEN** el sistema guarda el movimiento asociado a su userId, actualiza el saldo de la cuenta seleccionada y muestra una notificación de confirmación

#### Scenario: Actualización automática de indicadores tras registrar un ingreso
- **GIVEN** el usuario ha registrado exitosamente un movimiento de tipo "Ingreso"
- **WHEN** el sistema recalcula los indicadores del dashboard
- **THEN** el balance general, el gráfico de ingresos y el resumen del período correspondiente se actualizan automáticamente sin recargar la página

#### Scenario: Registro rechazado por monto o fecha inválidos
- **GIVEN** el usuario está completando el formulario de nuevo movimiento
- **WHEN** ingresa un monto negativo o igual a cero, o deja la fecha en blanco
- **THEN** el sistema bloquea el envío y muestra los mensajes de validación correspondientes ("El monto debe ser mayor a 0", "La fecha es obligatoria")

#### Scenario: Registro permitido con saldo insuficiente y advertencia
- **GIVEN** el usuario registra un movimiento de tipo "Gasto" cuyo monto supera el saldo disponible en la cuenta seleccionada
- **WHEN** confirma el registro
- **THEN** el sistema permite el registro pero muestra una advertencia "El monto excede el saldo disponible de la cuenta" para que el usuario tome conocimiento, sin bloquear la operación

### Requirement: Editar/Eliminar movimiento
El sistema SHALL permitir que el usuario edite o elimine sus propios movimientos financieros, recalculando el saldo de la cuenta asociada, los indicadores del dashboard y el seguimiento del presupuesto.

Origen: HU-09 (ver `docs/historias-de-usuario.md`).

#### Scenario: Edición exitosa de un movimiento propio
- **GIVEN** el usuario se encuentra en el historial de movimientos y selecciona un movimiento propio previamente registrado
- **WHEN** modifica el monto, la categoría o la descripción del movimiento y confirma los cambios
- **THEN** el sistema actualiza el registro, recalcula el saldo de la cuenta asociada y los indicadores del dashboard, y muestra una notificación de confirmación

#### Scenario: Eliminación exitosa de un movimiento propio
- **GIVEN** el usuario visualiza el detalle de un movimiento que ya no necesita conservar
- **WHEN** selecciona la opción "Eliminar" y confirma la acción en el cuadro de diálogo de SweetAlert2
- **THEN** el sistema elimina el movimiento, revierte el efecto de dicho movimiento sobre el saldo de la cuenta y actualiza automáticamente el historial, el dashboard y el seguimiento del presupuesto

#### Scenario: Edición rechazada por datos inválidos
- **GIVEN** el usuario intenta editar un movimiento
- **WHEN** ingresa un monto negativo, igual a cero, o deja un campo obligatorio vacío
- **THEN** el sistema bloquea el guardado de los cambios y muestra los mensajes de validación correspondientes, sin alterar el registro original

#### Scenario: Operación rechazada sobre un movimiento de otro usuario
- **GIVEN** el usuario A intenta editar o eliminar, mediante manipulación directa de la solicitud, un movimiento perteneciente al usuario B
- **WHEN** envía la solicitud de edición o eliminación a la API REST
- **THEN** el sistema valida en la capa de repositorio que el movimiento no pertenece a su userId/tenantId y rechaza la operación con un error 403/404, sin modificar ni eliminar el registro ajeno

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
