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
