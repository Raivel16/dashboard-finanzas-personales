# Historias de Usuario y Criterios de Aceptación

Proyecto: Dashboard de Finanzas Personales

Formato basado en la Guía Pedagógica y Práctica: Historias de Usuario y Gherkin (INVEST / BDD)

El presente documento contiene las Historias de Usuario (HU) y sus respectivos Criterios de Aceptación (CA), redactados en sintaxis Gherkin (Dado que / Cuando / Entonces), elaborados a partir de la información funcional del proyecto "Dashboard de Finanzas Personales" y siguiendo estrictamente el formato, la estructura y el principio INVEST establecidos en la Guía Pedagógica y Práctica proporcionada. Las historias se organizan por épicas/módulos funcionales y cada una incluye los cuatro escenarios obligatorios: Camino Feliz, Flujo Alternativo, Manejo de Errores y Caso de Borde.

## Épica 1: Autenticación y Gestión de Usuarios

### HU-01 — Registro de nuevo usuario

| Campo | Descripción |
|---|---|
| **ID** | HU-01 |
| **Rol** | Como visitante que aún no posee una cuenta en el sistema |
| **Funcionalidad** | Quiero crear una cuenta de usuario proporcionando mis datos personales, correo electrónico y contraseña |
| **Razón / Resultado** | Para poder acceder al dashboard y comenzar a registrar mis finanzas personales de forma segura |
| **Prioridad** | Alta |

#### Criterios de Aceptación en Sintaxis Gherkin (HU-01)

**Escenario 1: Registro exitoso con datos válidos**

- **DADO QUE** el visitante se encuentra en la página de registro y no posee una cuenta previa
- **CUANDO** completa el formulario con nombre, correo electrónico válido "usuario@correo.com" y una contraseña que cumple los requisitos mínimos de seguridad, y confirma el envío
- **ENTONCES** el sistema crea la cuenta, cifra la contraseña, asigna el rol "usuario estándar" por defecto y redirige al usuario a la pantalla de inicio de sesión con un mensaje de confirmación

**Escenario 2: Creación exitosa de identificadores y aislamiento de datos**

- **DADO QUE** el visitante ha completado el formulario de registro correctamente
- **CUANDO** el sistema genera exitosamente el nuevo userId/tenantId asociado a la cuenta
- **ENTONCES** el usuario recibe un correo de bienvenida y el sistema aísla automáticamente sus futuros datos financieros bajo su identificador único

**Escenario 3: Registro rechazado por correo ya registrado**

- **DADO QUE** el visitante está completando el formulario de registro
- **CUANDO** ingresa un correo electrónico que ya se encuentra registrado en el sistema
- **ENTONCES** el sistema rechaza el registro y muestra el mensaje "Este correo ya se encuentra registrado" sin crear una cuenta duplicada

**Escenario 4: Registro rechazado por contraseña insegura**

- **DADO QUE** el visitante ingresa una contraseña de solo 3 caracteres
- **CUANDO** intenta enviar el formulario de registro
- **ENTONCES** el sistema bloquea el envío, resalta el campo de contraseña y muestra el mensaje "La contraseña debe tener al menos 8 caracteres, incluir una mayúscula y un número"

### HU-02 — Inicio de sesión

| Campo | Descripción |
|---|---|
| **ID** | HU-02 |
| **Rol** | Como usuario registrado con una cuenta activa |
| **Funcionalidad** | Quiero iniciar sesión con mi correo electrónico y contraseña |
| **Razón / Resultado** | Para acceder de forma segura a mi información financiera personal |
| **Prioridad** | Alta |

#### Criterios de Aceptación en Sintaxis Gherkin (HU-02)

**Escenario 1: Inicio de sesión exitoso con credenciales válidas**

- **DADO QUE** el usuario registrado se encuentra en la pantalla de inicio de sesión
- **CUANDO** ingresa su correo electrónico y contraseña correctos y presiona "Iniciar sesión"
- **ENTONCES** el sistema valida las credenciales, genera un token JWT válido y redirige al usuario al dashboard principal según su rol

**Escenario 2: Acceso ampliado para un administrador**

- **DADO QUE** el usuario ha iniciado sesión correctamente y su rol es "administrador"
- **CUANDO** el sistema carga el dashboard
- **ENTONCES** el usuario visualiza además la sección "Administración", con la consulta en modo de solo lectura de los datos de los usuarios y la gestión de roles, no disponible para el rol "usuario estándar"

**Escenario 3: Bloqueo temporal por credenciales incorrectas**

- **DADO QUE** el usuario se encuentra en la pantalla de inicio de sesión
- **CUANDO** ingresa una contraseña incorrecta tres veces consecutivas
- **ENTONCES** el sistema muestra el mensaje "Credenciales inválidas" y bloquea temporalmente los intentos de inicio de sesión durante 5 minutos

**Escenario 4: Sesión invalidada por expiración del token**

- **DADO QUE** el usuario ha permanecido con la sesión iniciada sin actividad durante el tiempo de expiración del token JWT
- **CUANDO** intenta realizar una acción dentro del dashboard
- **ENTONCES** el sistema invalida la sesión, redirige a la pantalla de inicio de sesión y muestra el mensaje "Tu sesión ha expirado, por favor inicia sesión nuevamente"

### HU-03 — Recuperación de contraseña

| Campo | Descripción |
|---|---|
| **ID** | HU-03 |
| **Rol** | Como usuario registrado que no recuerda su contraseña |
| **Funcionalidad** | Quiero solicitar el restablecimiento de mi contraseña mediante mi correo electrónico registrado |
| **Razón / Resultado** | Para poder recuperar el acceso a mi cuenta sin perder mi historial financiero |
| **Prioridad** | Media |

#### Criterios de Aceptación en Sintaxis Gherkin (HU-03)

**Escenario 1: Solicitud exitosa de recuperación de contraseña**

- **DADO QUE** el usuario se encuentra en la pantalla "¿Olvidaste tu contraseña?"
- **CUANDO** ingresa su correo electrónico registrado y confirma la solicitud
- **ENTONCES** el sistema envía un enlace de restablecimiento con un token de un solo uso válido por 30 minutos al correo indicado

**Escenario 2: Restablecimiento exitoso mediante enlace válido**

- **DADO QUE** el usuario ha recibido el enlace de restablecimiento y accede a él dentro del tiempo válido
- **CUANDO** ingresa y confirma una nueva contraseña que cumple los requisitos de seguridad
- **ENTONCES** el sistema actualiza la contraseña cifrada, invalida el token utilizado y notifica al usuario que el cambio fue exitoso

**Escenario 3: Solicitud procesada sin revelar existencia de la cuenta**

- **DADO QUE** el usuario solicita el restablecimiento de contraseña
- **CUANDO** ingresa un correo electrónico que no está registrado en el sistema
- **ENTONCES** el sistema muestra un mensaje genérico "Si el correo existe, recibirás un enlace de recuperación" sin revelar si la cuenta existe, por motivos de seguridad

**Escenario 4: Enlace de recuperación expirado**

- **DADO QUE** el usuario intenta utilizar un enlace de restablecimiento que ya expiró (más de 30 minutos)
- **CUANDO** hace clic en el enlace vencido
- **ENTONCES** el sistema muestra el mensaje "El enlace ha expirado" y ofrece la opción de solicitar uno nuevo

### HU-18 — Cerrar sesión

| Campo | Descripción |
|---|---|
| **ID** | HU-18 |
| **Rol** | Como usuario con una sesión iniciada |
| **Funcionalidad** | Quiero cerrar mi sesión cuando termine de usar la aplicación |
| **Razón / Resultado** | Para que nadie más pueda acceder a mi información desde ese dispositivo |
| **Prioridad** | Alta |

#### Criterios de Aceptación en Sintaxis Gherkin (HU-18)

**Escenario 1: Cierre de sesión exitoso**

- **DADO QUE** el usuario ha iniciado sesión
- **CUANDO** selecciona "Cerrar sesión"
- **ENTONCES** el sistema cierra la sesión y lo redirige a la pantalla de inicio de sesión

**Escenario 2: Otras sesiones permanecen activas**

- **DADO QUE** el usuario tiene sesiones abiertas en su celular y en su computadora
- **CUANDO** cierra la sesión en la computadora
- **ENTONCES** la sesión del celular continúa activa

**Escenario 3: Regreso a una página tras cerrar sesión**

- **DADO QUE** el usuario cerró su sesión
- **CUANDO** usa el botón "Atrás" o abre un enlace guardado del dashboard
- **ENTONCES** el sistema le pide iniciar sesión y no muestra ningún dato financiero

**Escenario 4: Cierre de sesión con la sesión ya expirada**

- **DADO QUE** la sesión del usuario expiró por inactividad
- **CUANDO** selecciona "Cerrar sesión"
- **ENTONCES** el sistema lo lleva a la pantalla de inicio de sesión sin mostrar un error

### HU-19 — Mantener la sesión activa durante el uso

| Campo | Descripción |
|---|---|
| **ID** | HU-19 |
| **Rol** | Como usuario que está usando la aplicación |
| **Funcionalidad** | Quiero que mi sesión se renueve sola mientras siga activo |
| **Razón / Resultado** | Para trabajar sin interrupciones y con mis credenciales protegidas |
| **Prioridad** | Alta |

#### Criterios de Aceptación en Sintaxis Gherkin (HU-19)

**Escenario 1: Sesión renovada mientras el usuario está activo**

- **DADO QUE** el usuario inició sesión hace 2 horas y ha realizado acciones con intervalos menores a 30 minutos
- **CUANDO** realiza una nueva acción en el dashboard
- **ENTONCES** el sistema completa la acción sin pedirle iniciar sesión nuevamente

**Escenario 2: Regreso después de una pausa corta**

- **DADO QUE** el usuario dejó la aplicación abierta sin usarla durante 20 minutos
- **CUANDO** vuelve y realiza una acción
- **ENTONCES** el sistema la completa sin pedirle iniciar sesión

**Escenario 3: Sesión cerrada desde otro dispositivo**

- **DADO QUE** el usuario cambió su contraseña desde otro dispositivo
- **CUANDO** realiza una acción en este dispositivo
- **ENTONCES** el sistema lo lleva al inicio de sesión con el mensaje "Tu sesión se cerró, por favor inicia sesión nuevamente"

**Escenario 4: Límite máximo de la sesión**

- **DADO QUE** el usuario inició sesión hace 7 días y la ha usado a diario
- **CUANDO** realiza una nueva acción
- **ENTONCES** el sistema le pide iniciar sesión nuevamente

### HU-20 — Gestionar mi perfil

| Campo | Descripción |
|---|---|
| **ID** | HU-20 |
| **Rol** | Como usuario registrado |
| **Funcionalidad** | Quiero actualizar mi nombre y mi moneda principal |
| **Razón / Resultado** | Para mantener mis datos al día y ver el dashboard en la moneda que más uso |
| **Prioridad** | Media |

#### Criterios de Aceptación en Sintaxis Gherkin (HU-20)

**Escenario 1: Actualización exitosa del nombre**

- **DADO QUE** el usuario se encuentra en la sección "Mi perfil"
- **CUANDO** cambia su nombre y guarda los cambios
- **ENTONCES** el sistema actualiza el nombre, lo muestra en la navegación y confirma el cambio con una notificación

**Escenario 2: Cambio de moneda principal**

- **DADO QUE** la moneda principal del usuario es "PEN"
- **CUANDO** la cambia a "USD" y guarda
- **ENTONCES** el dashboard se abre desde entonces en "USD" y sus datos existentes no se modifican

**Escenario 3: Nombre inválido rechazado**

- **DADO QUE** el usuario edita su perfil
- **CUANDO** deja el nombre vacío
- **ENTONCES** el sistema bloquea el guardado y muestra el mensaje "El nombre es obligatorio"

**Escenario 4: Correo no editable**

- **DADO QUE** el usuario consulta su perfil
- **CUANDO** intenta modificar su correo electrónico
- **ENTONCES** el correo se muestra como dato de solo lectura con la nota "El correo no se puede cambiar"

### HU-21 — Cambiar mi contraseña

| Campo | Descripción |
|---|---|
| **ID** | HU-21 |
| **Rol** | Como usuario con una sesión iniciada |
| **Funcionalidad** | Quiero cambiar mi contraseña indicando la actual |
| **Razón / Resultado** | Para proteger mi cuenta si sospecho que alguien la conoce |
| **Prioridad** | Media |

#### Criterios de Aceptación en Sintaxis Gherkin (HU-21)

**Escenario 1: Cambio exitoso de contraseña**

- **DADO QUE** el usuario se encuentra en "Mi perfil"
- **CUANDO** ingresa su contraseña actual y una nueva válida, y confirma
- **ENTONCES** el sistema actualiza la contraseña cifrada y muestra una confirmación

**Escenario 2: Cierre de las demás sesiones**

- **DADO QUE** el usuario tiene otra sesión abierta en su celular
- **CUANDO** cambia su contraseña desde la computadora
- **ENTONCES** la sesión del celular se invalida y la actual continúa activa

**Escenario 3: Contraseña actual incorrecta**

- **DADO QUE** el usuario intenta cambiar su contraseña
- **CUANDO** ingresa una contraseña actual incorrecta
- **ENTONCES** el sistema rechaza el cambio y muestra el mensaje "La contraseña actual es incorrecta"

**Escenario 4: Nueva contraseña igual a la actual**

- **DADO QUE** el usuario intenta cambiar su contraseña
- **CUANDO** ingresa como nueva la misma contraseña actual
- **ENTONCES** el sistema rechaza el cambio y muestra el mensaje "La nueva contraseña debe ser distinta de la actual"

## Épica 2: Seguridad y Control de Acceso (RBAC)

### HU-04 — Control de acceso basado en roles

| Campo | Descripción |
|---|---|
| **ID** | HU-04 |
| **Rol** | Como administrador responsable del control de acceso del sistema |
| **Funcionalidad** | Quiero que el sistema restrinja las funcionalidades disponibles según el rol asignado a cada usuario (usuario estándar o administrador) |
| **Razón / Resultado** | Para garantizar que cada perfil acceda únicamente a las funciones que le corresponden y proteger la integridad del sistema |
| **Prioridad** | Alta |

#### Criterios de Aceptación en Sintaxis Gherkin (HU-04)

**Escenario 1: Restricción de acceso para usuario estándar**

- **DADO QUE** un usuario con rol "usuario estándar" ha iniciado sesión
- **CUANDO** intenta acceder a la sección de "Administración"
- **ENTONCES** el sistema oculta dicha opción del menú y, si se accede directamente por URL, responde con un error 403 "Acceso no autorizado"

**Escenario 2: Administración autorizada para usuario administrador**

- **DADO QUE** un usuario con rol "administrador" ha iniciado sesión
- **CUANDO** accede a la sección "Administración"
- **ENTONCES** el sistema le permite consultar en modo de solo lectura las categorías, cuentas y movimientos de todos los usuarios y gestionar sus roles, sin crear, editar ni eliminar sus datos financieros

**Escenario 3: Operación rechazada por falta de permisos**

- **DADO QUE** la capa de servicios recibe una solicitud para cambiar el rol de un usuario
- **CUANDO** la solicitud proviene de un token JWT correspondiente a un rol "usuario estándar"
- **ENTONCES** el sistema rechaza la operación en la capa de servicios y registra el intento de acceso no autorizado

**Escenario 4: Denegación tras degradación de rol durante una sesión**

- **DADO QUE** un usuario administrador es degradado a "usuario estándar" durante una sesión activa
- **CUANDO** el usuario intenta ejecutar nuevamente una acción exclusiva de administrador
- **ENTONCES** el sistema revalida el rol vigente en el token/base de datos y deniega la operación aunque la interfaz aún mostrara la opción previamente

### HU-05 — Privacidad de mis datos financieros

| Campo | Descripción |
|---|---|
| **ID** | HU-05 |
| **Rol** | Como usuario registrado |
| **Funcionalidad** | Quiero que mis movimientos, cuentas, categorías y presupuestos solo puedan ser vistos y modificados por mí |
| **Razón / Resultado** | Para que ningún otro usuario pueda ver ni alterar mi información financiera |
| **Prioridad** | Alta |

#### Criterios de Aceptación en Sintaxis Gherkin (HU-05)

**Escenario 1: Consulta de solo mis propios datos**

- **DADO QUE** el usuario A y el usuario B tienen movimientos registrados en el sistema
- **CUANDO** el usuario A consulta su historial de movimientos
- **ENTONCES** el sistema muestra únicamente los movimientos registrados por el usuario A

**Escenario 2: Nuevo registro visible solo para su propietario**

- **DADO QUE** el usuario A ha iniciado sesión
- **CUANDO** registra una nueva categoría llamada "Mascotas"
- **ENTONCES** la categoría aparece en el listado del usuario A y no aparece en el listado de categorías del usuario B

**Escenario 3: Acceso rechazado a un movimiento de otro usuario**

- **DADO QUE** el usuario B conoce el enlace directo a un movimiento del usuario A
- **CUANDO** intenta abrir o modificar ese movimiento
- **ENTONCES** el sistema rechaza la operación, muestra el mensaje "El recurso solicitado no existe o no tienes permiso para acceder a él" y no revela ningún dato del movimiento

**Escenario 4: Usuarios con categorías de igual nombre**

- **DADO QUE** el usuario A y el usuario B tienen cada uno una categoría llamada "Alimentación" con gastos registrados
- **CUANDO** el usuario A filtra su historial por la categoría "Alimentación"
- **ENTONCES** el sistema muestra solo los gastos del usuario A y los totales no incluyen los gastos del usuario B

### HU-22 — Consultar datos de usuarios en modo de solo lectura

| Campo | Descripción |
|---|---|
| **ID** | HU-22 |
| **Rol** | Como administrador del sistema |
| **Funcionalidad** | Quiero consultar los usuarios y sus categorías, cuentas, movimientos y presupuestos |
| **Razón / Resultado** | Para supervisar el sistema sin alterar la información financiera de nadie |
| **Prioridad** | Media |

#### Criterios de Aceptación en Sintaxis Gherkin (HU-22)

**Escenario 1: Consulta de los datos de un usuario**

- **DADO QUE** un administrador está en la sección "Administración"
- **CUANDO** selecciona a un usuario
- **ENTONCES** el sistema muestra sus categorías, cuentas, movimientos y presupuestos sin opciones para crear, editar ni eliminar

**Escenario 2: Búsqueda de usuarios**

- **DADO QUE** existen muchos usuarios registrados
- **CUANDO** el administrador busca por nombre o correo
- **ENTONCES** el sistema muestra un listado paginado con los usuarios que coinciden

**Escenario 3: Modificación de datos ajenos rechazada**

- **DADO QUE** un administrador visualiza los movimientos de otro usuario
- **CUANDO** intenta editar o eliminar uno de ellos por cualquier medio, incluso desde un enlace directo
- **ENTONCES** el sistema no lo permite, muestra el mensaje "El recurso solicitado no existe o no tienes permiso para acceder a él" y el movimiento permanece sin cambios

**Escenario 4: Usuario sin información registrada**

- **DADO QUE** un usuario no tiene movimientos
- **CUANDO** el administrador consulta sus datos
- **ENTONCES** el sistema muestra el estado vacío "Este usuario aún no tiene movimientos"

### HU-23 — Gestionar roles de usuarios

| Campo | Descripción |
|---|---|
| **ID** | HU-23 |
| **Rol** | Como administrador del sistema |
| **Funcionalidad** | Quiero cambiar el rol de los usuarios |
| **Razón / Resultado** | Para decidir quién puede administrar el sistema |
| **Prioridad** | Media |

#### Criterios de Aceptación en Sintaxis Gherkin (HU-23)

**Escenario 1: Promoción de un usuario a administrador**

- **DADO QUE** un administrador se encuentra en el listado de usuarios
- **CUANDO** cambia el rol de "ana@correo.com" a "administrador" y confirma
- **ENTONCES** el sistema actualiza el rol y el usuario obtiene acceso a "Administración" en su siguiente acción

**Escenario 2: Degradación de otro administrador**

- **DADO QUE** existen dos administradores
- **CUANDO** uno cambia el rol del otro a "usuario estándar" y confirma
- **ENTONCES** el sistema actualiza el rol y el usuario degradado pierde el acceso de inmediato

**Escenario 3: Cambio de rol sin confirmar**

- **DADO QUE** un administrador inicia el cambio de rol de un usuario
- **CUANDO** cierra el cuadro de confirmación sin aceptar
- **ENTONCES** el rol del usuario se mantiene sin cambios

**Escenario 4: Degradación del último administrador rechazada**

- **DADO QUE** existe un único usuario con rol "administrador"
- **CUANDO** ese administrador intenta cambiar su propio rol a "usuario estándar"
- **ENTONCES** el sistema rechaza el cambio y muestra el mensaje "Debe existir al menos un administrador"

## Épica 3: Gestión de Categorías

### HU-06 — Administrar categorías de ingresos y gastos

| Campo | Descripción |
|---|---|
| **ID** | HU-06 |
| **Rol** | Como usuario registrado que administra sus categorías financieras |
| **Funcionalidad** | Quiero crear, editar, listar y eliminar categorías para clasificar mis ingresos y gastos |
| **Razón / Resultado** | Para organizar mis movimientos financieros de forma personalizada y facilitar su análisis posterior |
| **Prioridad** | Alta |

#### Criterios de Aceptación en Sintaxis Gherkin (HU-06)

**Escenario 1: Creación exitosa de una categoría**

- **DADO QUE** el usuario se encuentra en la sección "Categorías" del dashboard
- **CUANDO** crea una nueva categoría de tipo "Gasto" con el nombre "Entretenimiento" y un ícono asociado
- **ENTONCES** el sistema guarda la categoría vinculada a su userId y la muestra disponible para su selección al registrar movimientos

**Escenario 2: Edición exitosa de una categoría existente**

- **DADO QUE** el usuario cuenta con una categoría existente llamada "Transporte"
- **CUANDO** edita el nombre de la categoría a "Movilidad" y guarda los cambios
- **ENTONCES** el sistema actualiza la categoría y refleja el nuevo nombre en todos los movimientos históricos previamente asociados

**Escenario 3: Creación rechazada por nombre de categoría duplicado**

- **DADO QUE** el usuario intenta crear una categoría
- **CUANDO** ingresa un nombre de categoría que ya existe para el mismo tipo (Ingreso/Gasto) dentro de su cuenta
- **ENTONCES** el sistema rechaza la creación y muestra el mensaje "Ya existe una categoría con ese nombre"

**Escenario 4: Eliminación impedida por movimientos asociados**

- **DADO QUE** el usuario intenta eliminar una categoría que tiene movimientos financieros asociados
- **CUANDO** confirma la acción de eliminación
- **ENTONCES** el sistema impide la eliminación directa y muestra la advertencia "No se puede eliminar una categoría con movimientos asociados. Reasigna o elimina los movimientos primero"

### HU-24 — Recibir categorías predeterminadas

| Campo | Descripción |
|---|---|
| **ID** | HU-24 |
| **Rol** | Como usuario que acaba de registrarse |
| **Funcionalidad** | Quiero contar con categorías iniciales de ingresos y gastos |
| **Razón / Resultado** | Para registrar movimientos de inmediato sin configurar todo desde cero |
| **Prioridad** | Media |

#### Criterios de Aceptación en Sintaxis Gherkin (HU-24)

**Escenario 1: Categorías disponibles tras el registro**

- **DADO QUE** un visitante completó su registro
- **CUANDO** ingresa por primera vez a "Categorías"
- **ENTONCES** el sistema muestra categorías de gasto ("Alimentación", "Transporte", "Vivienda", "Salud", "Entretenimiento", "Educación", "Otros gastos") y de ingreso ("Sueldo", "Ventas", "Otros ingresos") asociadas a su usuario

**Escenario 2: Edición sin afectar a otros usuarios**

- **DADO QUE** los usuarios A y B tienen la categoría predeterminada "Transporte"
- **CUANDO** el usuario A la renombra a "Movilidad"
- **ENTONCES** la categoría del usuario B sigue llamándose "Transporte"

**Escenario 3: Falla al crear las categorías iniciales**

- **DADO QUE** ocurre un error al crear las categorías durante el registro
- **CUANDO** el sistema procesa el registro
- **ENTONCES** no queda una cuenta incompleta y el visitante recibe un mensaje para intentarlo nuevamente

**Escenario 4: Categoría predeterminada eliminada**

- **DADO QUE** el usuario eliminó una categoría predeterminada sin movimientos
- **CUANDO** vuelve a iniciar sesión
- **ENTONCES** la categoría no reaparece

## Épica 4: Gestión de Cuentas y Medios de Pago

### HU-07 — Administrar cuentas o medios de pago

| Campo | Descripción |
|---|---|
| **ID** | HU-07 |
| **Rol** | Como usuario registrado que administra sus cuentas y medios de pago |
| **Funcionalidad** | Quiero registrar, editar, listar y eliminar mis cuentas o medios de pago (efectivo, cuenta bancaria, tarjeta de crédito, billetera digital) |
| **Razón / Resultado** | Para asociar correctamente cada movimiento financiero al origen o destino real del dinero |
| **Prioridad** | Alta |

#### Criterios de Aceptación en Sintaxis Gherkin (HU-07)

**Escenario 1: Registro exitoso de una cuenta o medio de pago**

- **DADO QUE** el usuario se encuentra en la sección "Cuentas" del dashboard
- **CUANDO** registra una nueva cuenta de tipo "Tarjeta de crédito" con nombre "Visa Principal" y saldo inicial de 0
- **ENTONCES** el sistema crea la cuenta vinculada a su userId y la muestra disponible como origen/destino al registrar movimientos

**Escenario 2: Edición exitosa de una cuenta existente**

- **DADO QUE** el usuario posee una cuenta "Efectivo" registrada
- **CUANDO** edita el nombre de la cuenta a "Efectivo Personal" y guarda los cambios
- **ENTONCES** el sistema actualiza el nombre y mantiene intacto el historial de movimientos asociados a dicha cuenta

**Escenario 3: Registro rechazado por nombre de cuenta vacío**

- **DADO QUE** el usuario intenta registrar una nueva cuenta
- **CUANDO** deja el campo "Nombre de la cuenta" vacío y presiona "Guardar"
- **ENTONCES** el sistema bloquea el envío del formulario y muestra el mensaje "El nombre de la cuenta es obligatorio"

**Escenario 4: Eliminación impedida por movimientos asociados**

- **DADO QUE** el usuario intenta eliminar una cuenta que posee movimientos financieros registrados
- **CUANDO** confirma la acción de eliminación
- **ENTONCES** el sistema impide la eliminación y muestra la advertencia "No se puede eliminar una cuenta con movimientos asociados"

### HU-25 — Definir moneda y saldo inicial de la cuenta

| Campo | Descripción |
|---|---|
| **ID** | HU-25 |
| **Rol** | Como usuario que maneja dinero en distintas monedas |
| **Funcionalidad** | Quiero indicar la moneda y el saldo inicial de cada cuenta |
| **Razón / Resultado** | Para que mis saldos reflejen el dinero real sin mezclar monedas |
| **Prioridad** | Alta |

#### Criterios de Aceptación en Sintaxis Gherkin (HU-25)

**Escenario 1: Cuenta creada en otra moneda**

- **DADO QUE** el usuario registra una cuenta
- **CUANDO** elige la moneda "USD" y un saldo inicial de 200.00
- **ENTONCES** el sistema crea la cuenta en "USD" y muestra su saldo con el símbolo "$"

**Escenario 2: Corrección del saldo inicial**

- **DADO QUE** una cuenta con movimientos tiene saldo inicial 100.00 y saldo actual 70.00
- **CUANDO** el usuario corrige el saldo inicial a 120.00
- **ENTONCES** el saldo actual pasa a 90.00 y los movimientos no cambian

**Escenario 3: Moneda no seleccionada**

- **DADO QUE** el usuario registra una nueva cuenta
- **CUANDO** no selecciona ninguna moneda y presiona "Guardar"
- **ENTONCES** el sistema bloquea el guardado y muestra el mensaje "La moneda es obligatoria"

**Escenario 4: Cambio de moneda impedido en una cuenta con movimientos**

- **DADO QUE** el usuario posee una cuenta "Ahorros" en "USD" con movimientos
- **CUANDO** intenta cambiar su moneda a "PEN"
- **ENTONCES** el sistema rechaza el cambio y muestra el mensaje "No se puede cambiar la moneda de una cuenta con movimientos asociados"

## Épica 5: Gestión de Transacciones (Movimientos)

### HU-08 — Registrar movimiento financiero (ingreso o gasto)

| Campo | Descripción |
|---|---|
| **ID** | HU-08 |
| **Rol** | Como usuario registrado que gestiona sus movimientos financieros |
| **Funcionalidad** | Quiero registrar un nuevo movimiento financiero indicando tipo (ingreso/gasto), monto, categoría, cuenta, fecha y descripción |
| **Razón / Resultado** | Para mantener actualizado y ordenado el control de mis finanzas personales |
| **Prioridad** | Alta |

#### Criterios de Aceptación en Sintaxis Gherkin (HU-08)

**Escenario 1: Registro exitoso de un movimiento financiero**

- **DADO QUE** el usuario se encuentra en el formulario "Nuevo movimiento" con al menos una categoría y una cuenta previamente registradas
- **CUANDO** selecciona el tipo "Gasto", ingresa el monto 150.00, la categoría "Alimentación", la cuenta "Efectivo", la fecha actual y una descripción, y confirma el registro
- **ENTONCES** el sistema guarda el movimiento asociado a su userId, actualiza el saldo de la cuenta seleccionada y muestra una notificación de confirmación

**Escenario 2: Actualización automática de indicadores tras registrar un ingreso**

- **DADO QUE** el usuario ha registrado exitosamente un movimiento de tipo "Ingreso"
- **CUANDO** el sistema recalcula los indicadores del dashboard
- **ENTONCES** el balance general, el gráfico de ingresos y el resumen del período correspondiente se actualizan automáticamente sin recargar la página

**Escenario 3: Registro rechazado por monto o fecha inválidos**

- **DADO QUE** el usuario está completando el formulario de nuevo movimiento
- **CUANDO** ingresa un monto negativo o igual a cero, o deja la fecha en blanco
- **ENTONCES** el sistema bloquea el envío y muestra los mensajes de validación correspondientes ("El monto debe ser mayor a 0", "La fecha es obligatoria")

**Escenario 4: Registro permitido con saldo insuficiente y advertencia**

- **DADO QUE** el usuario registra un movimiento de tipo "Gasto" cuyo monto supera el saldo disponible en la cuenta seleccionada
- **CUANDO** confirma el registro
- **ENTONCES** el sistema permite el registro pero muestra una advertencia "El monto excede el saldo disponible de la cuenta" para que el usuario tome conocimiento, sin bloquear la operación

### HU-09 — Editar/Eliminar movimiento (HU adicional)

| Campo | Descripción |
|---|---|
| **ID** | HU-09 |
| **Rol** | Como usuario registrado que necesita corregir o eliminar movimientos propios |
| **Funcionalidad** | Quiero editar o eliminar un movimiento financiero (ingreso o gasto) que registré previamente |
| **Razón / Resultado** | Para poder corregir errores de digitación o eliminar registros duplicados o incorrectos, manteniendo mi información financiera precisa y confiable |
| **Prioridad** | Media |

#### Criterios de Aceptación en Sintaxis Gherkin (HU-09)

**Escenario 1: Edición exitosa de un movimiento propio**

- **DADO QUE** el usuario se encuentra en el historial de movimientos y selecciona un movimiento propio previamente registrado
- **CUANDO** modifica el monto, la categoría o la descripción del movimiento y confirma los cambios
- **ENTONCES** el sistema actualiza el registro, recalcula el saldo de la cuenta asociada y los indicadores del dashboard, y muestra una notificación de confirmación

**Escenario 2: Eliminación exitosa de un movimiento propio**

- **DADO QUE** el usuario visualiza el detalle de un movimiento que ya no necesita conservar
- **CUANDO** selecciona la opción "Eliminar" y confirma la acción en el cuadro de diálogo de SweetAlert2
- **ENTONCES** el sistema elimina el movimiento, revierte el efecto de dicho movimiento sobre el saldo de la cuenta y actualiza automáticamente el historial, el dashboard y el seguimiento del presupuesto

**Escenario 3: Edición rechazada por datos inválidos**

- **DADO QUE** el usuario intenta editar un movimiento
- **CUANDO** ingresa un monto negativo, igual a cero, o deja un campo obligatorio vacío
- **ENTONCES** el sistema bloquea el guardado de los cambios y muestra los mensajes de validación correspondientes, sin alterar el registro original

**Escenario 4: Operación rechazada sobre un movimiento de otro usuario**

- **DADO QUE** el usuario A intenta editar o eliminar, mediante manipulación directa de la solicitud, un movimiento perteneciente al usuario B
- **CUANDO** envía la solicitud de edición o eliminación a la API REST
- **ENTONCES** el sistema valida en la capa de repositorio que el movimiento no pertenece a su userId/tenantId y rechaza la operación con un error 403/404, sin modificar ni eliminar el registro ajeno

### HU-26 — Mantener el saldo de la cuenta consistente

| Campo | Descripción |
|---|---|
| **ID** | HU-26 |
| **Rol** | Como usuario que confía en sus cifras |
| **Funcionalidad** | Quiero que el saldo de cada cuenta coincida siempre con sus movimientos |
| **Razón / Resultado** | Para poder comprobar de dónde sale cada cifra |
| **Prioridad** | Alta |

#### Criterios de Aceptación en Sintaxis Gherkin (HU-26)

**Escenario 1: Saldo coherente tras varias operaciones**

- **DADO QUE** la cuenta "Efectivo" tiene saldo inicial 100.00
- **CUANDO** el usuario registra un ingreso de 50.00, un gasto de 30.00 y luego elimina el ingreso
- **ENTONCES** el saldo de la cuenta es 70.00

**Escenario 2: Saldo resultante en el historial**

- **DADO QUE** la cuenta "Efectivo" tiene varios movimientos
- **CUANDO** el usuario consulta su historial
- **ENTONCES** cada movimiento muestra el saldo que dejó en su cuenta, calculado por fecha y orden de registro, aunque existan filtros aplicados

**Escenario 3: Registro interrumpido no altera el saldo**

- **DADO QUE** la cuenta "Efectivo" tiene saldo 70.00
- **CUANDO** se pierde la conexión mientras el usuario registra un gasto de 20.00
- **ENTONCES** el gasto queda registrado con saldo 50.00 o no queda registrado y el saldo sigue en 70.00; nunca se registra sin descontarse

**Escenario 4: Movimiento registrado con fecha anterior**

- **DADO QUE** la cuenta tiene movimientos hasta el 15/11/2026
- **CUANDO** el usuario registra un gasto con fecha 10/11/2026
- **ENTONCES** el sistema recalcula el saldo que dejó cada movimiento posterior y el saldo final es correcto

### HU-27 — Validar la coherencia del movimiento

| Campo | Descripción |
|---|---|
| **ID** | HU-27 |
| **Rol** | Como usuario que registra movimientos |
| **Funcionalidad** | Quiero que el sistema valide moneda, categoría, fecha y montos |
| **Razón / Resultado** | Para evitar errores que distorsionen mis saldos y reportes |
| **Prioridad** | Alta |

#### Criterios de Aceptación en Sintaxis Gherkin (HU-27)

**Escenario 1: Movimiento registrado en la moneda de su cuenta**

- **DADO QUE** el usuario tiene la cuenta "Ahorros USD" en "USD"
- **CUANDO** registra un gasto de 40.00 en esa cuenta
- **ENTONCES** el movimiento queda en "USD" y el saldo de la cuenta disminuye en 40.00

**Escenario 2: Cambio de cuenta al editar un movimiento**

- **DADO QUE** existe un gasto de 40.00 en "Ahorros USD"
- **CUANDO** el usuario lo asigna a la cuenta "Efectivo" en "PEN"
- **ENTONCES** el movimiento pasa a "PEN", "Ahorros USD" aumenta en 40.00 y "Efectivo" disminuye en 40.00

**Escenario 3: Categoría incompatible con el tipo**

- **DADO QUE** el usuario eligió la categoría de gasto "Alimentación" en el formulario
- **CUANDO** cambia el tipo de movimiento a "Ingreso"
- **ENTONCES** el sistema quita la categoría y muestra el mensaje "Selecciona una categoría de ingreso"

**Escenario 4: Fecha futura rechazada**

- **DADO QUE** hoy es 18/11/2026
- **CUANDO** el usuario registra un movimiento con fecha 19/11/2026
- **ENTONCES** el sistema lo rechaza con el mensaje "La fecha no puede ser futura"; la fecha de hoy sí se acepta

## Épica 6: Consulta y Filtrado de Movimientos

### HU-10 — Consultar historial de movimientos financieros

| Campo | Descripción |
|---|---|
| **ID** | HU-10 |
| **Rol** | Como usuario registrado que consulta su historial financiero |
| **Funcionalidad** | Quiero visualizar un listado cronológico de todos mis movimientos financieros registrados |
| **Razón / Resultado** | Para revisar de forma detallada mi actividad financiera pasada |
| **Prioridad** | Alta |

#### Criterios de Aceptación en Sintaxis Gherkin (HU-10)

**Escenario 1: Consulta exitosa del historial de movimientos**

- **DADO QUE** el usuario tiene al menos 10 movimientos registrados
- **CUANDO** accede a la sección "Historial de movimientos"
- **ENTONCES** el sistema muestra un listado paginado ordenado por fecha descendente, con tipo, categoría, cuenta, monto y descripción de cada movimiento

**Escenario 2: Visualización del detalle de un movimiento**

- **DADO QUE** el usuario se encuentra visualizando el historial de movimientos
- **CUANDO** selecciona un movimiento específico de la lista
- **ENTONCES** el sistema despliega el detalle completo del movimiento en una vista o modal ampliada

**Escenario 3: Error controlado al cargar el historial**

- **DADO QUE** el usuario intenta acceder a la sección de historial
- **CUANDO** ocurre un error de comunicación con la API REST
- **ENTONCES** el sistema muestra el mensaje "No se pudo cargar el historial. Intenta nuevamente" junto con una opción para reintentar la carga

**Escenario 4: Visualización del historial sin movimientos**

- **DADO QUE** el usuario aún no ha registrado ningún movimiento financiero
- **CUANDO** accede a la sección "Historial de movimientos"
- **ENTONCES** el sistema muestra un estado vacío con el mensaje "Aún no tienes movimientos registrados" y un botón de acceso directo para crear el primero

### HU-11 — Filtrar movimientos por fecha, categoría y tipo

| Campo | Descripción |
|---|---|
| **ID** | HU-11 |
| **Rol** | Como usuario registrado que analiza sus movimientos mediante filtros |
| **Funcionalidad** | Quiero filtrar el historial de movimientos por rango de fechas, categoría y tipo de movimiento (ingreso/gasto) |
| **Razón / Resultado** | Para localizar rápidamente información específica y analizar mis hábitos de consumo por período o categoría |
| **Prioridad** | Media |

#### Criterios de Aceptación en Sintaxis Gherkin (HU-11)

**Escenario 1: Filtrado exitoso por fecha y categoría**

- **DADO QUE** el usuario se encuentra en el historial de movimientos con múltiples registros
- **CUANDO** define un rango de fechas del 01/08/2026 al 31/08/2026 y selecciona la categoría "Alimentación"
- **ENTONCES** el sistema muestra únicamente los movimientos que cumplen simultáneamente ambos criterios de filtrado

**Escenario 2: Combinación exitosa de filtros**

- **DADO QUE** el usuario ha aplicado un filtro por tipo "Ingreso"
- **CUANDO** decide combinarlo adicionalmente con el filtro de cuenta "Cuenta Bancaria"
- **ENTONCES** el sistema actualiza el listado mostrando solo los ingresos registrados en dicha cuenta

**Escenario 3: Filtro rechazado por rango de fechas inválido**

- **DADO QUE** el usuario está configurando el filtro de rango de fechas
- **CUANDO** ingresa una fecha de inicio posterior a la fecha de fin
- **ENTONCES** el sistema muestra la alerta "La fecha inicial no puede ser mayor a la fecha final" y deshabilita el botón "Aplicar filtros"

**Escenario 4: Resultado vacío por filtros sin coincidencias**

- **DADO QUE** el usuario aplica un conjunto de filtros que no coincide con ningún movimiento registrado
- **CUANDO** el sistema ejecuta la búsqueda
- **ENTONCES** se muestra el mensaje "No se encontraron movimientos con los filtros seleccionados" junto con la opción de "Limpiar filtros"

## Épica 7: Dashboard e Indicadores Financieros

### HU-12 — Visualizar indicadores financieros en el dashboard

| Campo | Descripción |
|---|---|
| **ID** | HU-12 |
| **Rol** | Como usuario registrado que consulta sus indicadores financieros |
| **Funcionalidad** | Quiero visualizar en un dashboard interactivo los indicadores clave de mis finanzas (total de ingresos, total de gastos, balance general y presupuesto del mes) |
| **Razón / Resultado** | Para tener una visión rápida y clara de mi situación financiera actual |
| **Prioridad** | Alta |

#### Criterios de Aceptación en Sintaxis Gherkin (HU-12)

**Escenario 1: Visualización exitosa de indicadores del período actual**

- **DADO QUE** el usuario tiene movimientos registrados en el mes en curso
- **CUANDO** accede a la pantalla principal del dashboard
- **ENTONCES** el sistema calcula y muestra en tarjetas resumen el total de ingresos, total de gastos, balance neto y porcentaje de presupuesto utilizado del mes actual

**Escenario 2: Actualización de indicadores al cambiar el período**

- **DADO QUE** el usuario se encuentra en el dashboard
- **CUANDO** cambia el período de análisis a un mes anterior mediante el selector de fecha
- **ENTONCES** el sistema recalcula y actualiza todos los indicadores mostrados conforme al período seleccionado

**Escenario 3: Error controlado al cargar indicadores**

- **DADO QUE** ocurre una falla temporal en la conexión con la API REST al calcular los indicadores
- **CUANDO** el usuario carga el dashboard
- **ENTONCES** el sistema muestra un estado de error controlado con el mensaje "No se pudieron cargar los indicadores" y un botón para reintentar, sin romper la interfaz

**Escenario 4: Indicadores en cero cuando no existen movimientos**

- **DADO QUE** el usuario no ha registrado ningún movimiento en el período seleccionado
- **CUANDO** el dashboard calcula los indicadores
- **ENTONCES** el sistema muestra todos los valores en cero (S/ 0.00) y un mensaje motivacional indicando que aún no existen movimientos para ese período

### HU-13 — Visualizar gráficos financieros interactivos

| Campo | Descripción |
|---|---|
| **ID** | HU-13 |
| **Rol** | Como usuario registrado que analiza visualmente sus finanzas |
| **Funcionalidad** | Quiero visualizar gráficos interactivos de ingresos, gastos, balance y distribución de gastos por categoría |
| **Razón / Resultado** | Para identificar patrones y hábitos de consumo que me ayuden a tomar mejores decisiones financieras |
| **Prioridad** | Alta |

#### Criterios de Aceptación en Sintaxis Gherkin (HU-13)

**Escenario 1: Visualización exitosa de gráficos financieros**

- **DADO QUE** el usuario tiene movimientos registrados en los últimos 6 meses
- **CUANDO** accede a la sección de gráficos del dashboard
- **ENTONCES** el sistema renderiza mediante Chart.js un gráfico de líneas o barras con la evolución de ingresos y gastos, y un gráfico circular con la distribución de gastos por categoría

**Escenario 2: Consulta de detalles mediante tooltip interactivo**

- **DADO QUE** el usuario está visualizando el gráfico de distribución de gastos por categoría
- **CUANDO** posiciona el cursor sobre uno de los segmentos del gráfico
- **ENTONCES** el sistema muestra un tooltip interactivo con el nombre de la categoría, el monto exacto y el porcentaje que representa sobre el total

**Escenario 3: Error controlado al generar gráficos**

- **DADO QUE** el usuario intenta cargar los gráficos financieros
- **CUANDO** la solicitud a la API REST responde con un error 500
- **ENTONCES** el sistema muestra un mensaje "No se pudieron generar los gráficos en este momento" en el espacio del gráfico, sin afectar el resto del dashboard

**Escenario 4: Estado vacío del gráfico sin gastos registrados**

- **DADO QUE** el usuario solo ha registrado movimientos de tipo "Ingreso" y ningún "Gasto" en el período consultado
- **CUANDO** se genera el gráfico de distribución de gastos por categoría
- **ENTONCES** el sistema muestra un estado vacío específico para ese gráfico indicando "No hay gastos registrados en este período" sin generar un gráfico circular vacío o erróneo

### HU-28 — Ver el dashboard por moneda

| Campo | Descripción |
|---|---|
| **ID** | HU-28 |
| **Rol** | Como usuario con cuentas en varias monedas |
| **Funcionalidad** | Quiero elegir la moneda de mis indicadores y gráficos |
| **Razón / Resultado** | Para analizar cada moneda sin sumas engañosas |
| **Prioridad** | Alta |

#### Criterios de Aceptación en Sintaxis Gherkin (HU-28)

**Escenario 1: Dashboard en la moneda principal**

- **DADO QUE** la moneda principal es "PEN" y hay movimientos en "PEN" y "USD"
- **CUANDO** el usuario accede al dashboard
- **ENTONCES** los indicadores y gráficos muestran solo los totales en "PEN" con el símbolo "S/"

**Escenario 2: Cambio de moneda en el dashboard**

- **DADO QUE** el usuario ve el dashboard en "PEN"
- **CUANDO** selecciona "USD"
- **ENTONCES** el sistema recalcula todo usando solo los movimientos en "USD"

**Escenario 3: Error al cambiar de moneda**

- **DADO QUE** el usuario ve el dashboard en "PEN"
- **CUANDO** selecciona "USD" y ocurre un error de conexión
- **ENTONCES** el sistema mantiene visibles los datos en "PEN" y muestra el mensaje "No se pudieron cargar los indicadores en USD" con la opción de reintentar

**Escenario 4: Selector limitado a las monedas en uso**

- **DADO QUE** el usuario solo tiene cuentas en "PEN"
- **CUANDO** abre el selector de moneda
- **ENTONCES** el sistema muestra únicamente "PEN"; si aún no tiene cuentas, muestra su moneda principal

## Épica 8: Presupuestos

### HU-14 — Definir presupuesto mensual

| Campo | Descripción |
|---|---|
| **ID** | HU-14 |
| **Rol** | Como usuario registrado que establece sus límites de gasto |
| **Funcionalidad** | Quiero definir un monto de presupuesto mensual general o por categoría de gasto |
| **Razón / Resultado** | Para establecer un límite de gasto que me ayude a controlar mis finanzas de forma proactiva |
| **Prioridad** | Media |

#### Criterios de Aceptación en Sintaxis Gherkin (HU-14)

**Escenario 1: Definición exitosa de presupuesto mensual**

- **DADO QUE** el usuario se encuentra en la sección "Presupuesto"
- **CUANDO** define un presupuesto mensual de 1500.00 para el mes en curso y lo guarda
- **ENTONCES** el sistema almacena el presupuesto asociado a su userId y al período seleccionado, y lo muestra disponible para su seguimiento

**Escenario 2: Asignación exitosa de presupuesto por categoría**

- **DADO QUE** el usuario ya cuenta con un presupuesto general definido para el mes
- **CUANDO** adicionalmente asigna un sub-presupuesto de 300.00 a la categoría "Entretenimiento"
- **ENTONCES** el sistema registra el presupuesto por categoría y lo utiliza para el seguimiento específico de dicha categoría

**Escenario 3: Presupuesto rechazado por monto inválido**

- **DADO QUE** el usuario intenta definir un presupuesto mensual
- **CUANDO** ingresa un monto negativo o deja el campo vacío
- **ENTONCES** el sistema bloquea el guardado y muestra el mensaje "El presupuesto debe ser un monto mayor a 0"

**Escenario 4: Confirmación para reemplazar un presupuesto existente**

- **DADO QUE** el usuario intenta definir un nuevo presupuesto para un mes que ya tiene un presupuesto previamente configurado
- **CUANDO** confirma el guardado
- **ENTONCES** el sistema le solicita confirmación explícita "Ya existe un presupuesto para este mes, ¿deseas reemplazarlo?" antes de sobrescribir el valor anterior

### HU-15 — Seguimiento del cumplimiento del presupuesto

| Campo | Descripción |
|---|---|
| **ID** | HU-15 |
| **Rol** | Como usuario registrado que controla el cumplimiento de su presupuesto |
| **Funcionalidad** | Quiero visualizar el porcentaje de avance de mi gasto respecto al presupuesto definido para el mes |
| **Razón / Resultado** | Para tomar decisiones oportunas y evitar excederme en mis gastos mensuales |
| **Prioridad** | Media |

#### Criterios de Aceptación en Sintaxis Gherkin (HU-15)

**Escenario 1: Visualización exitosa del avance del presupuesto**

- **DADO QUE** el usuario tiene un presupuesto mensual de 1500.00 definido y ha registrado gastos por 900.00 en el mes en curso
- **CUANDO** accede al indicador de seguimiento de presupuesto en el dashboard
- **ENTONCES** el sistema muestra una barra de progreso indicando 60% de presupuesto utilizado y el monto restante disponible (600.00)

**Escenario 2: Notificación al alcanzar el umbral de alerta**

- **DADO QUE** el usuario ha alcanzado el 90% de su presupuesto mensual
- **CUANDO** el sistema detecta dicho umbral
- **ENTONCES** muestra una notificación tipo Toastify de advertencia "Has utilizado el 90% de tu presupuesto mensual"

**Escenario 3: Seguimiento no disponible sin presupuesto definido**

- **DADO QUE** el usuario no ha definido ningún presupuesto para el mes en curso
- **CUANDO** intenta visualizar el indicador de seguimiento de presupuesto
- **ENTONCES** el sistema muestra el mensaje "No has definido un presupuesto para este mes" junto con un acceso directo para crearlo

**Escenario 4: Visualización del presupuesto excedido**

- **DADO QUE** el usuario ha registrado gastos que superan el 100% del presupuesto mensual definido
- **CUANDO** visualiza el indicador de seguimiento
- **ENTONCES** el sistema muestra la barra de progreso al límite en color de alerta (rojo), indica el porcentaje excedido (por ejemplo 115%) y el monto sobregirado

### HU-29 — Definir presupuestos por moneda y período

| Campo | Descripción |
|---|---|
| **ID** | HU-29 |
| **Rol** | Como usuario con gastos en varias monedas |
| **Funcionalidad** | Quiero definir presupuestos separados por moneda |
| **Razón / Resultado** | Para controlar cada moneda con un límite propio |
| **Prioridad** | Media |

#### Criterios de Aceptación en Sintaxis Gherkin (HU-29)

**Escenario 1: Presupuestos independientes por moneda**

- **DADO QUE** el usuario tiene presupuestos de 1500.00 PEN y 200.00 USD para el mes
- **CUANDO** registra un gasto de 50.00 USD
- **ENTONCES** el avance en USD sube a 25 % y el de PEN no cambia

**Escenario 2: Gastos en otra moneda no cuentan**

- **DADO QUE** el usuario solo tiene un presupuesto de 1500.00 PEN
- **CUANDO** registra gastos por 300.00 USD
- **ENTONCES** el porcentaje utilizado en PEN no cambia

**Escenario 3: Mes pasado rechazado**

- **DADO QUE** el usuario define un presupuesto
- **CUANDO** selecciona un mes anterior al actual
- **ENTONCES** el sistema lo rechaza con el mensaje "Solo puedes definir presupuestos para el mes actual o meses futuros"; los presupuestos pasados se pueden consultar

**Escenario 4: Presupuesto en una moneda sin gastos**

- **DADO QUE** el usuario definió un presupuesto en "EUR" y no tiene gastos en esa moneda
- **CUANDO** consulta su seguimiento
- **ENTONCES** el sistema muestra 0 % utilizado y el monto completo disponible

### HU-30 — Mantener los presupuestos por categoría dentro del general

| Campo | Descripción |
|---|---|
| **ID** | HU-30 |
| **Rol** | Como usuario que planifica sus gastos |
| **Funcionalidad** | Quiero repartir mi presupuesto general entre categorías |
| **Razón / Resultado** | Para que mis límites por categoría sean coherentes con mi límite total |
| **Prioridad** | Media |

#### Criterios de Aceptación en Sintaxis Gherkin (HU-30)

**Escenario 1: Presupuesto por categoría dentro del general**

- **DADO QUE** el usuario tiene un presupuesto general de 1500.00 PEN y categorías que suman 1000.00
- **CUANDO** asigna 300.00 a "Entretenimiento"
- **ENTONCES** el sistema lo guarda y muestra 200.00 sin asignar

**Escenario 2: Gasto sin presupuesto de categoría**

- **DADO QUE** la categoría "Salud" no tiene presupuesto propio
- **CUANDO** el usuario registra un gasto en "Salud"
- **ENTONCES** el gasto cuenta para el presupuesto general

**Escenario 3: Suma superior al presupuesto general**

- **DADO QUE** el usuario tiene 200.00 sin asignar
- **CUANDO** intenta asignar 300.00 a una categoría
- **ENTONCES** el sistema lo rechaza con el mensaje "La suma por categorías supera el presupuesto general"

**Escenario 4: Reducción del general por debajo de lo asignado**

- **DADO QUE** las categorías suman 1300.00
- **CUANDO** el usuario intenta reducir el presupuesto general a 1000.00
- **ENTONCES** el sistema lo rechaza con el mensaje "El presupuesto general no puede ser menor a lo asignado por categorías"

## Épica 9: Reportes y Exportación

### HU-16 — Exportar reporte financiero en PDF

| Campo | Descripción |
|---|---|
| **ID** | HU-16 |
| **Rol** | Como usuario registrado que necesita obtener un reporte financiero en PDF |
| **Funcionalidad** | Quiero exportar un reporte de mis movimientos financieros y/o indicadores en formato PDF |
| **Razón / Resultado** | Para conservar, imprimir o compartir un respaldo formal de mi información financiera |
| **Prioridad** | Media |

#### Criterios de Aceptación en Sintaxis Gherkin (HU-16)

**Escenario 1: Exportación exitosa de reporte financiero en PDF**

- **DADO QUE** el usuario se encuentra en la sección de historial o dashboard con datos filtrados según sus necesidades
- **CUANDO** selecciona la opción "Exportar a PDF"
- **ENTONCES** el sistema genera, mediante jsPDF, un documento PDF con los movimientos o indicadores correspondientes al filtro aplicado y lo descarga automáticamente al dispositivo del usuario

**Escenario 2: Exportación con período por defecto**

- **DADO QUE** el usuario exporta un reporte en PDF sin aplicar ningún filtro previo
- **CUANDO** confirma la exportación
- **ENTONCES** el sistema genera el reporte considerando el período por defecto (mes en curso) e indica dicho período en el encabezado del documento

**Escenario 3: Exportación deshabilitada sin datos disponibles**

- **DADO QUE** el usuario intenta exportar un reporte en PDF
- **CUANDO** no existen movimientos que coincidan con los filtros aplicados
- **ENTONCES** el sistema deshabilita el botón "Exportar a PDF" y muestra el mensaje "No hay datos disponibles para exportar"

**Escenario 4: Generación controlada de PDF con alto volumen de movimientos**

- **DADO QUE** el usuario intenta exportar un reporte con un volumen muy alto de movimientos (por ejemplo, más de 1000 registros)
- **CUANDO** confirma la exportación
- **ENTONCES** el sistema procesa la generación del PDF mostrando un indicador de carga y, de exceder un tiempo razonable, informa al usuario que el proceso continúa en segundo plano sin bloquear la interfaz

### HU-17 — Exportar reporte financiero en Excel

| Campo | Descripción |
|---|---|
| **ID** | HU-17 |
| **Rol** | Como usuario registrado que necesita obtener sus movimientos en Excel |
| **Funcionalidad** | Quiero exportar mis movimientos financieros a un archivo Excel |
| **Razón / Resultado** | Para poder analizar, manipular o respaldar mi información financiera en una hoja de cálculo externa |
| **Prioridad** | Media |

#### Criterios de Aceptación en Sintaxis Gherkin (HU-17)

**Escenario 1: Exportación exitosa de movimientos a Excel**

- **DADO QUE** el usuario se encuentra en la sección de historial de movimientos con datos filtrados
- **CUANDO** selecciona la opción "Exportar a Excel"
- **ENTONCES** el sistema genera, mediante SheetJS, un archivo .xlsx con columnas correspondientes a fecha, tipo, categoría, cuenta, monto y descripción, y lo descarga al dispositivo del usuario

**Escenario 2: Exportación con resumen por categoría y tipo**

- **DADO QUE** el usuario exporta un reporte a Excel con múltiples categorías filtradas
- **CUANDO** el sistema genera el archivo
- **ENTONCES** el archivo Excel incluye una hoja adicional de "Resumen" con los totales agrupados por categoría y tipo de movimiento

**Escenario 3: Exportación deshabilitada sin datos disponibles**

- **DADO QUE** el usuario intenta exportar un reporte a Excel
- **CUANDO** no existen movimientos que coincidan con los filtros aplicados
- **ENTONCES** el sistema deshabilita el botón "Exportar a Excel" y muestra el mensaje "No hay datos disponibles para exportar"

**Escenario 4: Cancelación segura de descarga ante interrupción de conexión**

- **DADO QUE** el usuario exporta un reporte a Excel mientras la conexión con el servidor se interrumpe a mitad de la generación
- **CUANDO** ocurre el corte de conexión
- **ENTONCES** el sistema cancela la descarga, muestra el mensaje "Ocurrió un error al generar el archivo. Intenta nuevamente" y no genera un archivo corrupto o incompleto

### HU-31 — Exportar reportes separados por moneda

| Campo | Descripción |
|---|---|
| **ID** | HU-31 |
| **Rol** | Como usuario con movimientos en varias monedas |
| **Funcionalidad** | Quiero que mis reportes separen los totales por moneda |
| **Razón / Resultado** | Para que los archivos exportados sean correctos y verificables |
| **Prioridad** | Media |

#### Criterios de Aceptación en Sintaxis Gherkin (HU-31)

**Escenario 1: Reporte Excel con varias monedas**

- **DADO QUE** existen movimientos en "PEN" y "USD" en el período filtrado
- **CUANDO** el usuario exporta a Excel
- **ENTONCES** la hoja "Resumen" muestra los totales por categoría y tipo separados por moneda

**Escenario 2: Reporte PDF con totales por moneda**

- **DADO QUE** existen movimientos en "PEN" y "USD" en el período filtrado
- **CUANDO** el usuario exporta a PDF
- **ENTONCES** el documento muestra ingresos, gastos y balance por separado para cada moneda

**Escenario 3: Excel que supera el límite**

- **DADO QUE** los filtros incluyen más de 5000 movimientos
- **CUANDO** el usuario exporta a Excel
- **ENTONCES** el sistema no genera el archivo y muestra el mensaje "El reporte supera los 5000 movimientos. Reduce el período o aplica más filtros"

**Escenario 4: Reporte aislado por usuario**

- **DADO QUE** los usuarios A y B tienen movimientos en el mismo período
- **CUANDO** el usuario A exporta su reporte
- **ENTONCES** el archivo contiene solo los datos del usuario A

## Resumen General de Historias de Usuario

| ID | Épica | Título de la Historia | Prioridad |
|---|---|---|---|
| HU-01 | Autenticación y Gestión de Usuarios | Registro de nuevo usuario | Alta |
| HU-02 | Autenticación y Gestión de Usuarios | Inicio de sesión | Alta |
| HU-03 | Autenticación y Gestión de Usuarios | Recuperación de contraseña | Media |
| HU-04 | Seguridad y Control de Acceso (RBAC) | Control de acceso basado en roles | Alta |
| HU-05 | Seguridad y Control de Acceso (RBAC) | Privacidad de mis datos financieros | Alta |
| HU-06 | Gestión de Categorías | Administrar categorías de ingresos y gastos | Alta |
| HU-07 | Gestión de Cuentas y Medios de Pago | Administrar cuentas o medios de pago | Alta |
| HU-08 | Gestión de Transacciones (Movimientos) | Registrar movimiento financiero (ingreso o gasto) | Alta |
| HU-09 | Gestión de Transacciones (Movimientos) | Editar/Eliminar movimiento (HU adicional) | Media |
| HU-10 | Consulta y Filtrado de Movimientos | Consultar historial de movimientos financieros | Alta |
| HU-11 | Consulta y Filtrado de Movimientos | Filtrar movimientos por fecha, categoría y tipo | Media |
| HU-12 | Dashboard e Indicadores Financieros | Visualizar indicadores financieros en el dashboard | Alta |
| HU-13 | Dashboard e Indicadores Financieros | Visualizar gráficos financieros interactivos | Alta |
| HU-14 | Presupuestos | Definir presupuesto mensual | Media |
| HU-15 | Presupuestos | Seguimiento del cumplimiento del presupuesto | Media |
| HU-16 | Reportes y Exportación | Exportar reporte financiero en PDF | Media |
| HU-17 | Reportes y Exportación | Exportar reporte financiero en Excel | Media |
| HU-18 | Autenticación y Gestión de Usuarios | Cerrar sesión | Alta |
| HU-19 | Autenticación y Gestión de Usuarios | Mantener la sesión activa durante el uso | Alta |
| HU-20 | Autenticación y Gestión de Usuarios | Gestionar mi perfil | Media |
| HU-21 | Autenticación y Gestión de Usuarios | Cambiar mi contraseña | Media |
| HU-22 | Seguridad y Control de Acceso (RBAC) | Consultar datos de usuarios en modo de solo lectura | Media |
| HU-23 | Seguridad y Control de Acceso (RBAC) | Gestionar roles de usuarios | Media |
| HU-24 | Gestión de Categorías | Recibir categorías predeterminadas | Media |
| HU-25 | Gestión de Cuentas y Medios de Pago | Definir moneda y saldo inicial de la cuenta | Alta |
| HU-26 | Gestión de Transacciones (Movimientos) | Mantener el saldo de la cuenta consistente | Alta |
| HU-27 | Gestión de Transacciones (Movimientos) | Validar la coherencia del movimiento | Alta |
| HU-28 | Dashboard e Indicadores Financieros | Ver el dashboard por moneda | Alta |
| HU-29 | Presupuestos | Definir presupuestos por moneda y período | Media |
| HU-30 | Presupuestos | Mantener los presupuestos por categoría dentro del general | Media |
| HU-31 | Reportes y Exportación | Exportar reportes separados por moneda | Media |

## Supuestos y Vacíos Detectados

- El requisito (j) "Validar la información ingresada por el usuario y gestionar adecuadamente los errores" se interpretó como un requisito transversal aplicable a todas las historias, por lo que sus criterios se integraron en los escenarios de "Manejo de Errores" de cada historia relacionada, en lugar de crear una historia de usuario independiente.
- El documento del proyecto especifica únicamente la acción de "Registrar" ingresos y gastos (punto a); no menciona explícitamente la edición o eliminación de movimientos ya registrados. A solicitud expresa del equipo, se incorporó la historia HU-09 "Editar/Eliminar movimiento" como HU adicional (fuera del alcance literal del documento del proyecto) para cubrir esta necesidad funcional habitual en este tipo de aplicaciones; se recomienda que el equipo confirme formalmente su inclusión en el alcance del proyecto.
- No se especifican en el proyecto los tiempos exactos de expiración del token JWT ni del enlace de recuperación de contraseña. Se asumieron valores estándar de la industria (ej. 30 minutos) a modo de referencia, los cuales deben ser confirmados y parametrizados por el equipo técnico.
- La guía pedagógica no exige explícitamente un campo "Prioridad" dentro de la estructura de la Historia de Usuario (ID, Rol, Funcionalidad, Razón/Resultado). Se incluyó como buena práctica estándar de gestión de backlog (Scrum/INVEST), aclarando que es un campo adicional y no forma parte del formato obligatorio descrito en la guía.
- El proyecto no detalla el/los umbral(es) exacto(s) de notificación de presupuesto (por ejemplo 80%, 90% o 100%). Se utilizó 90% como umbral de alerta a modo ilustrativo en HU-15, sujeto a validación con el equipo de negocio.
- No se especifica si el rol "administrador" puede modificar movimientos financieros de otros usuarios o solo visualizarlos/consultarlos de forma consolidada. Se asumió, en HU-04, que el administrador puede visualizar los datos de todos los tenants (según el texto del proyecto: "visualización de todos los datos"), pero no se le otorgó capacidad de edición sobre movimientos ajenos por no estar explícitamente solicitado; se recomienda confirmar este alcance con el cliente.

## Verificación de Cumplimiento de la Rúbrica de Evaluación

| Criterio de la Rúbrica | Evidencia en este documento |
|---|---|
| Sintaxis y Estructura Gherkin (40%) | Las 31 historias incluyen 4 escenarios cada una (Happy Path, Flujo Alternativo, Manejo de Errores, Caso de Borde) redactados estrictamente en formato Dado que / Cuando / Entonces, sin mezclar contexto, acción y resultado. |
| Coherencia y Valor de Negocio (35%) | Cada historia está delimitada al alcance funcional del proyecto (a-l del documento), especifica un rol concreto, una funcionalidad accionable y un beneficio de negocio claro y justificable. |
| Completitud y Uso de Plantilla (25%) | Se completan los campos ID, Rol, Funcionalidad, Razón/Resultado y Prioridad para cada historia, agrupadas por épica, con tabla resumen final y sección de supuestos, siguiendo el formato de la guía pedagógica. |
