# autenticacion-usuarios Specification

## Purpose
Permitir que los visitantes creen una cuenta y que los usuarios registrados inicien sesión y recuperen su contraseña de forma segura, como puerta de entrada al dashboard de finanzas personales.

Épica de origen: Autenticación y Gestión de Usuarios (HU-01, HU-02, HU-03).

## Requirements

### Requirement: Registro de nuevo usuario
El sistema SHALL permitir que un visitante cree una cuenta de usuario proporcionando nombre, correo electrónico y contraseña, validando que el correo no esté registrado y que la contraseña cumpla los requisitos mínimos de seguridad.

Origen: HU-01 (ver `docs/historias-de-usuario.md`).

#### Scenario: Registro exitoso con datos válidos
- **GIVEN** el visitante se encuentra en la página de registro y no posee una cuenta previa
- **WHEN** completa el formulario con nombre, correo electrónico válido "usuario@correo.com" y una contraseña que cumple los requisitos mínimos de seguridad, y confirma el envío
- **THEN** el sistema crea la cuenta, cifra la contraseña, asigna el rol "usuario estándar" por defecto y redirige al usuario a la pantalla de inicio de sesión con un mensaje de confirmación

#### Scenario: Creación exitosa de identificadores y aislamiento de datos
- **GIVEN** el visitante ha completado el formulario de registro correctamente
- **WHEN** el sistema genera exitosamente el nuevo userId/tenantId asociado a la cuenta
- **THEN** el usuario recibe un correo de bienvenida y el sistema aísla automáticamente sus futuros datos financieros bajo su identificador único

#### Scenario: Registro rechazado por correo ya registrado
- **GIVEN** el visitante está completando el formulario de registro
- **WHEN** ingresa un correo electrónico que ya se encuentra registrado en el sistema
- **THEN** el sistema rechaza el registro y muestra el mensaje "Este correo ya se encuentra registrado" sin crear una cuenta duplicada

#### Scenario: Registro rechazado por contraseña insegura
- **GIVEN** el visitante ingresa una contraseña de solo 3 caracteres
- **WHEN** intenta enviar el formulario de registro
- **THEN** el sistema bloquea el envío, resalta el campo de contraseña y muestra el mensaje "La contraseña debe tener al menos 8 caracteres, incluir una mayúscula y un número"

### Requirement: Inicio de sesión
El sistema SHALL permitir que un usuario registrado inicie sesión con su correo electrónico y contraseña, emitiendo un token JWT y dirigiéndolo al dashboard según su rol.

Origen: HU-02 (ver `docs/historias-de-usuario.md`).

#### Scenario: Inicio de sesión exitoso con credenciales válidas
- **GIVEN** el usuario registrado se encuentra en la pantalla de inicio de sesión
- **WHEN** ingresa su correo electrónico y contraseña correctos y presiona "Iniciar sesión"
- **THEN** el sistema valida las credenciales, genera un token JWT válido y redirige al usuario al dashboard principal según su rol

#### Scenario: Acceso ampliado para un administrador
- **GIVEN** el usuario ha iniciado sesión correctamente y su rol es "administrador"
- **WHEN** el sistema carga el dashboard
- **THEN** el usuario visualiza además la sección "Administración", con la consulta en modo de solo lectura de los datos de los usuarios y la gestión de roles, no disponible para el rol "usuario estándar"

#### Scenario: Bloqueo temporal por credenciales incorrectas
- **GIVEN** el usuario se encuentra en la pantalla de inicio de sesión
- **WHEN** ingresa una contraseña incorrecta tres veces consecutivas
- **THEN** el sistema muestra el mensaje "Credenciales inválidas" y bloquea temporalmente los intentos de inicio de sesión durante 5 minutos

#### Scenario: Sesión invalidada por expiración del token
- **GIVEN** el usuario ha permanecido con la sesión iniciada sin actividad durante el tiempo de expiración del token JWT
- **WHEN** intenta realizar una acción dentro del dashboard
- **THEN** el sistema invalida la sesión, redirige a la pantalla de inicio de sesión y muestra el mensaje "Tu sesión ha expirado, por favor inicia sesión nuevamente"

### Requirement: Recuperación de contraseña
El sistema SHALL permitir que un usuario registrado restablezca su contraseña mediante un enlace de un solo uso y con tiempo de validez limitado, enviado a su correo electrónico registrado.

Origen: HU-03 (ver `docs/historias-de-usuario.md`).

#### Scenario: Solicitud exitosa de recuperación de contraseña
- **GIVEN** el usuario se encuentra en la pantalla "¿Olvidaste tu contraseña?"
- **WHEN** ingresa su correo electrónico registrado y confirma la solicitud
- **THEN** el sistema envía un enlace de restablecimiento con un token de un solo uso válido por 30 minutos al correo indicado

#### Scenario: Restablecimiento exitoso mediante enlace válido
- **GIVEN** el usuario ha recibido el enlace de restablecimiento y accede a él dentro del tiempo válido
- **WHEN** ingresa y confirma una nueva contraseña que cumple los requisitos de seguridad
- **THEN** el sistema actualiza la contraseña cifrada, invalida el token utilizado y notifica al usuario que el cambio fue exitoso

#### Scenario: Solicitud procesada sin revelar existencia de la cuenta
- **GIVEN** el usuario solicita el restablecimiento de contraseña
- **WHEN** ingresa un correo electrónico que no está registrado en el sistema
- **THEN** el sistema muestra un mensaje genérico "Si el correo existe, recibirás un enlace de recuperación" sin revelar si la cuenta existe, por motivos de seguridad

#### Scenario: Enlace de recuperación expirado
- **GIVEN** el usuario intenta utilizar un enlace de restablecimiento que ya expiró (más de 30 minutos)
- **WHEN** hace clic en el enlace vencido
- **THEN** el sistema muestra el mensaje "El enlace ha expirado" y ofrece la opción de solicitar uno nuevo

### Requirement: Cerrar sesión
El sistema SHALL permitir que el usuario cierre su sesión de forma que no pueda reutilizarse para acceder a sus datos.

Origen: HU-18 (ver `docs/historias-de-usuario.md`).

#### Scenario: Cierre de sesión exitoso
- **GIVEN** el usuario ha iniciado sesión
- **WHEN** selecciona "Cerrar sesión"
- **THEN** el sistema cierra la sesión y lo redirige a la pantalla de inicio de sesión

#### Scenario: Otras sesiones permanecen activas
- **GIVEN** el usuario tiene sesiones abiertas en su celular y en su computadora
- **WHEN** cierra la sesión en la computadora
- **THEN** la sesión del celular continúa activa

#### Scenario: Regreso a una página tras cerrar sesión
- **GIVEN** el usuario cerró su sesión
- **WHEN** usa el botón "Atrás" o abre un enlace guardado del dashboard
- **THEN** el sistema le pide iniciar sesión y no muestra ningún dato financiero

#### Scenario: Cierre de sesión con la sesión ya expirada
- **GIVEN** la sesión del usuario expiró por inactividad
- **WHEN** selecciona "Cerrar sesión"
- **THEN** el sistema lo lleva a la pantalla de inicio de sesión sin mostrar un error

### Requirement: Mantener la sesión activa durante el uso
El sistema SHALL mantener la sesión abierta mientras el usuario tenga actividad con intervalos menores a 30 minutos, sin pedirle que vuelva a iniciar sesión, hasta un máximo de 7 días.

Origen: HU-19 (ver `docs/historias-de-usuario.md`).

#### Scenario: Sesión renovada mientras el usuario está activo
- **GIVEN** el usuario inició sesión hace 2 horas y ha realizado acciones con intervalos menores a 30 minutos
- **WHEN** realiza una nueva acción en el dashboard
- **THEN** el sistema completa la acción sin pedirle iniciar sesión nuevamente

#### Scenario: Regreso después de una pausa corta
- **GIVEN** el usuario dejó la aplicación abierta sin usarla durante 20 minutos
- **WHEN** vuelve y realiza una acción
- **THEN** el sistema la completa sin pedirle iniciar sesión

#### Scenario: Sesión cerrada desde otro dispositivo
- **GIVEN** el usuario cambió su contraseña desde otro dispositivo
- **WHEN** realiza una acción en este dispositivo
- **THEN** el sistema lo lleva al inicio de sesión con el mensaje "Tu sesión se cerró, por favor inicia sesión nuevamente"

#### Scenario: Límite máximo de la sesión
- **GIVEN** el usuario inició sesión hace 7 días y la ha usado a diario
- **WHEN** realiza una nueva acción
- **THEN** el sistema le pide iniciar sesión nuevamente

### Requirement: Gestionar mi perfil
El sistema SHALL permitir que el usuario consulte su perfil y actualice su nombre y su moneda principal. El correo electrónico MUST permanecer de solo lectura.

Origen: HU-20 (ver `docs/historias-de-usuario.md`).

#### Scenario: Actualización exitosa del nombre
- **GIVEN** el usuario se encuentra en la sección "Mi perfil"
- **WHEN** cambia su nombre y guarda los cambios
- **THEN** el sistema actualiza el nombre, lo muestra en la navegación y confirma el cambio con una notificación

#### Scenario: Cambio de moneda principal
- **GIVEN** la moneda principal del usuario es "PEN"
- **WHEN** la cambia a "USD" y guarda
- **THEN** el dashboard se abre desde entonces en "USD" y sus datos existentes no se modifican

#### Scenario: Nombre inválido rechazado
- **GIVEN** el usuario edita su perfil
- **WHEN** deja el nombre vacío
- **THEN** el sistema bloquea el guardado y muestra el mensaje "El nombre es obligatorio"

#### Scenario: Correo no editable
- **GIVEN** el usuario consulta su perfil
- **WHEN** intenta modificar su correo electrónico
- **THEN** el correo se muestra como dato de solo lectura con la nota "El correo no se puede cambiar"

### Requirement: Cambiar mi contraseña
El sistema SHALL permitir que el usuario cambie su contraseña indicando la actual y una nueva que cumpla los requisitos de seguridad, cerrando sus demás sesiones.

Origen: HU-21 (ver `docs/historias-de-usuario.md`).

#### Scenario: Cambio exitoso de contraseña
- **GIVEN** el usuario se encuentra en "Mi perfil"
- **WHEN** ingresa su contraseña actual y una nueva válida, y confirma
- **THEN** el sistema actualiza la contraseña cifrada y muestra una confirmación

#### Scenario: Cierre de las demás sesiones
- **GIVEN** el usuario tiene otra sesión abierta en su celular
- **WHEN** cambia su contraseña desde la computadora
- **THEN** la sesión del celular se invalida y la actual continúa activa

#### Scenario: Contraseña actual incorrecta
- **GIVEN** el usuario intenta cambiar su contraseña
- **WHEN** ingresa una contraseña actual incorrecta
- **THEN** el sistema rechaza el cambio y muestra el mensaje "La contraseña actual es incorrecta"

#### Scenario: Nueva contraseña igual a la actual
- **GIVEN** el usuario intenta cambiar su contraseña
- **WHEN** ingresa como nueva la misma contraseña actual
- **THEN** el sistema rechaza el cambio y muestra el mensaje "La nueva contraseña debe ser distinta de la actual"
