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
- **WHEN** intenta acceder a la sección de "Administración"
- **THEN** el sistema oculta dicha opción del menú y, si se accede directamente por URL, responde con un error 403 "Acceso no autorizado"

#### Scenario: Administración autorizada para usuario administrador
- **GIVEN** un usuario con rol "administrador" ha iniciado sesión
- **WHEN** accede a la sección "Administración"
- **THEN** el sistema le permite consultar en modo de solo lectura las categorías, cuentas y movimientos de todos los usuarios y gestionar sus roles, sin crear, editar ni eliminar sus datos financieros

#### Scenario: Operación rechazada por falta de permisos
- **GIVEN** la capa de servicios recibe una solicitud para cambiar el rol de un usuario
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

### Requirement: Consultar datos de usuarios en modo de solo lectura
El sistema SHALL permitir que un administrador liste a los usuarios y consulte sus datos financieros en modo de solo lectura. Las operaciones de escritura sobre datos ajenos MUST NOT estar disponibles.

Origen: HU-22 (ver `docs/historias-de-usuario.md`).

#### Scenario: Consulta de los datos de un usuario
- **GIVEN** un administrador está en la sección "Administración"
- **WHEN** selecciona a un usuario
- **THEN** el sistema muestra sus categorías, cuentas, movimientos y presupuestos sin opciones para crear, editar ni eliminar

#### Scenario: Búsqueda de usuarios
- **GIVEN** existen muchos usuarios registrados
- **WHEN** el administrador busca por nombre o correo
- **THEN** el sistema muestra un listado paginado con los usuarios que coinciden

#### Scenario: Modificación de datos ajenos rechazada
- **GIVEN** un administrador visualiza los movimientos de otro usuario
- **WHEN** intenta editar o eliminar uno de ellos por cualquier medio, incluso desde un enlace directo
- **THEN** el sistema no lo permite, muestra el mensaje "El recurso solicitado no existe o no tienes permiso para acceder a él" y el movimiento permanece sin cambios

#### Scenario: Usuario sin información registrada
- **GIVEN** un usuario no tiene movimientos
- **WHEN** el administrador consulta sus datos
- **THEN** el sistema muestra el estado vacío "Este usuario aún no tiene movimientos"

### Requirement: Gestionar roles de usuarios
El sistema SHALL permitir que un administrador cambie el rol de cualquier usuario entre "usuario estándar" y "administrador", y MUST impedir que el sistema se quede sin administradores.

Origen: HU-23 (ver `docs/historias-de-usuario.md`).

#### Scenario: Promoción de un usuario a administrador
- **GIVEN** un administrador se encuentra en el listado de usuarios
- **WHEN** cambia el rol de "ana@correo.com" a "administrador" y confirma
- **THEN** el sistema actualiza el rol y el usuario obtiene acceso a "Administración" en su siguiente acción

#### Scenario: Degradación de otro administrador
- **GIVEN** existen dos administradores
- **WHEN** uno cambia el rol del otro a "usuario estándar" y confirma
- **THEN** el sistema actualiza el rol y el usuario degradado pierde el acceso de inmediato

#### Scenario: Cambio de rol sin confirmar
- **GIVEN** un administrador inicia el cambio de rol de un usuario
- **WHEN** cierra el cuadro de confirmación sin aceptar
- **THEN** el rol del usuario se mantiene sin cambios

#### Scenario: Degradación del último administrador rechazada
- **GIVEN** existe un único usuario con rol "administrador"
- **WHEN** ese administrador intenta cambiar su propio rol a "usuario estándar"
- **THEN** el sistema rechaza el cambio y muestra el mensaje "Debe existir al menos un administrador"
