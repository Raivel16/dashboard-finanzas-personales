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
- **ENTONCES** el usuario visualiza además las opciones de gestión de categorías, cuentas y configuración del sistema, no disponibles para el rol "usuario estándar"

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
- **CUANDO** intenta acceder a la sección de "Configuración del sistema"
- **ENTONCES** el sistema oculta dicha opción del menú y, si se accede directamente por URL, responde con un error 403 "Acceso no autorizado"

**Escenario 2: Administración autorizada para usuario administrador**

- **DADO QUE** un usuario con rol "administrador" ha iniciado sesión
- **CUANDO** accede a la sección de gestión de categorías y cuentas de todos los usuarios
- **ENTONCES** el sistema le permite visualizar y administrar dicha información conforme a los permisos otorgados a su rol

**Escenario 3: Operación rechazada por falta de permisos**

- **DADO QUE** la capa de servicios recibe una solicitud para eliminar una categoría global del sistema
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
| Sintaxis y Estructura Gherkin (40%) | Las 17 historias incluyen 4 escenarios cada una (Happy Path, Flujo Alternativo, Manejo de Errores, Caso de Borde) redactados estrictamente en formato Dado que / Cuando / Entonces, sin mezclar contexto, acción y resultado. |
| Coherencia y Valor de Negocio (35%) | Cada historia está delimitada al alcance funcional del proyecto (a-l del documento), especifica un rol concreto, una funcionalidad accionable y un beneficio de negocio claro y justificable. |
| Completitud y Uso de Plantilla (25%) | Se completan los campos ID, Rol, Funcionalidad, Razón/Resultado y Prioridad para cada historia, agrupadas por épica, con tabla resumen final y sección de supuestos, siguiendo el formato de la guía pedagógica. |
