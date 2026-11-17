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
