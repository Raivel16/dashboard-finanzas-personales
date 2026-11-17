# control-acceso Specification

## Purpose
Restringir las funcionalidades según el rol de cada usuario (usuario estándar o administrador) y garantizar que la información financiera de cada usuario solo sea visible y modificable por su propietario.

Épica de origen: Seguridad y Control de Acceso (RBAC) (HU-04, HU-05).

## Requirements

### Requirement: Control de acceso basado en roles
El sistema SHALL restringir las funcionalidades disponibles según el rol asignado a cada usuario (usuario estándar o administrador), validando el rol vigente tanto en la interfaz como en la capa de servicios.

Origen: HU-04 (ver `docs/historias-de-usuario.md`).

#### Scenario: Restricción de acceso para usuario estándar
- **GIVEN** un usuario con rol "usuario estándar" ha iniciado sesión
- **WHEN** intenta acceder a la sección de "Configuración del sistema"
- **THEN** el sistema oculta dicha opción del menú y, si se accede directamente por URL, responde con un error 403 "Acceso no autorizado"

#### Scenario: Administración autorizada para usuario administrador
- **GIVEN** un usuario con rol "administrador" ha iniciado sesión
- **WHEN** accede a la sección de gestión de categorías y cuentas de todos los usuarios
- **THEN** el sistema le permite visualizar y administrar dicha información conforme a los permisos otorgados a su rol

#### Scenario: Operación rechazada por falta de permisos
- **GIVEN** la capa de servicios recibe una solicitud para eliminar una categoría global del sistema
- **WHEN** la solicitud proviene de un token JWT correspondiente a un rol "usuario estándar"
- **THEN** el sistema rechaza la operación en la capa de servicios y registra el intento de acceso no autorizado

#### Scenario: Denegación tras degradación de rol durante una sesión
- **GIVEN** un usuario administrador es degradado a "usuario estándar" durante una sesión activa
- **WHEN** el usuario intenta ejecutar nuevamente una acción exclusiva de administrador
- **THEN** el sistema revalida el rol vigente en el token/base de datos y deniega la operación aunque la interfaz aún mostrara la opción previamente

### Requirement: Privacidad de mis datos financieros
El sistema SHALL garantizar que los movimientos, cuentas, categorías y presupuestos de un usuario solo puedan ser vistos y modificados por ese usuario.

Origen: HU-05 (ver `docs/historias-de-usuario.md`).

#### Scenario: Consulta de solo mis propios datos
- **GIVEN** el usuario A y el usuario B tienen movimientos registrados en el sistema
- **WHEN** el usuario A consulta su historial de movimientos
- **THEN** el sistema muestra únicamente los movimientos registrados por el usuario A

#### Scenario: Nuevo registro visible solo para su propietario
- **GIVEN** el usuario A ha iniciado sesión
- **WHEN** registra una nueva categoría llamada "Mascotas"
- **THEN** la categoría aparece en el listado del usuario A y no aparece en el listado de categorías del usuario B

#### Scenario: Acceso rechazado a un movimiento de otro usuario
- **GIVEN** el usuario B conoce el enlace directo a un movimiento del usuario A
- **WHEN** intenta abrir o modificar ese movimiento
- **THEN** el sistema rechaza la operación, muestra el mensaje "El recurso solicitado no existe o no tienes permiso para acceder a él" y no revela ningún dato del movimiento

#### Scenario: Usuarios con categorías de igual nombre
- **GIVEN** el usuario A y el usuario B tienen cada uno una categoría llamada "Alimentación" con gastos registrados
- **WHEN** el usuario A filtra su historial por la categoría "Alimentación"
- **THEN** el sistema muestra solo los gastos del usuario A y los totales no incluyen los gastos del usuario B
