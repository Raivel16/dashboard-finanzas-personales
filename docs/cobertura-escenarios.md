# Cobertura de escenarios

Cada uno de los 132 escenarios de [historias-de-usuario.md](historias-de-usuario.md) (33 historias) y la prueba automática que lo verifica. "server/tests" son pruebas de la API (Jest + Supertest) y "client/tests" pruebas de la interfaz (Vitest + Testing Library).

Este archivo se genera con `npm run cobertura` a partir de [cobertura-escenarios.json](cobertura-escenarios.json); la integración continua falla si un escenario queda sin prueba o si este archivo no está al día (RT-09).


## HU-01 — Registro de nuevo usuario

| # | Escenario | Pruebas |
|---|---|---|
| 1 | Registro exitoso con datos válidos | [registro.test.js:16](../server/tests/registro.test.js#L16)<br>[autenticacion.test.jsx:55](../client/tests/autenticacion.test.jsx#L55) |
| 2 | Creación exitosa de identificadores y aislamiento de datos | [registro.test.js:35](../server/tests/registro.test.js#L35) |
| 3 | Registro rechazado por correo ya registrado | [registro.test.js:61](../server/tests/registro.test.js#L61)<br>[autenticacion.test.jsx:74](../client/tests/autenticacion.test.jsx#L74) |
| 4 | Registro rechazado por contraseña insegura | [registro.test.js:85](../server/tests/registro.test.js#L85)<br>[autenticacion.test.jsx:89](../client/tests/autenticacion.test.jsx#L89) |

## HU-02 — Inicio de sesión

| # | Escenario | Pruebas |
|---|---|---|
| 1 | Inicio de sesión exitoso con credenciales válidas | [sesion.test.js:31](../server/tests/sesion.test.js#L31)<br>[autenticacion.test.jsx:117](../client/tests/autenticacion.test.jsx#L117) |
| 2 | Acceso ampliado para un administrador | [sesion.test.js:58](../server/tests/sesion.test.js#L58)<br>[administracion.test.jsx:52](../client/tests/administracion.test.jsx#L52) |
| 3 | Bloqueo temporal por credenciales incorrectas | [sesion.test.js:70](../server/tests/sesion.test.js#L70)<br>[autenticacion.test.jsx:134](../client/tests/autenticacion.test.jsx#L134) |
| 4 | Sesión invalidada por expiración del token | [sesion.test.js:156](../server/tests/sesion.test.js#L156)<br>[autenticacion.test.jsx:157](../client/tests/autenticacion.test.jsx#L157) |

## HU-03 — Recuperación de contraseña

| # | Escenario | Pruebas |
|---|---|---|
| 1 | Solicitud exitosa de recuperación de contraseña | [recuperacion.test.js:26](../server/tests/recuperacion.test.js#L26)<br>[autenticacion.test.jsx:226](../client/tests/autenticacion.test.jsx#L226) |
| 2 | Restablecimiento exitoso mediante enlace válido | [recuperacion.test.js:37](../server/tests/recuperacion.test.js#L37)<br>[autenticacion.test.jsx:245](../client/tests/autenticacion.test.jsx#L245) |
| 3 | Solicitud procesada sin revelar existencia de la cuenta | [recuperacion.test.js:54](../server/tests/recuperacion.test.js#L54) |
| 4 | Enlace de recuperación expirado | [recuperacion.test.js:65](../server/tests/recuperacion.test.js#L65)<br>[autenticacion.test.jsx:266](../client/tests/autenticacion.test.jsx#L266) |

## HU-18 — Cerrar sesión

| # | Escenario | Pruebas |
|---|---|---|
| 1 | Cierre de sesión exitoso | [cierre.test.js:14](../server/tests/cierre.test.js#L14)<br>[autenticacion.test.jsx:207](../client/tests/autenticacion.test.jsx#L207) |
| 2 | Otras sesiones permanecen activas | [cierre.test.js:33](../server/tests/cierre.test.js#L33) |
| 3 | Regreso a una página tras cerrar sesión | [cierre.test.js:42](../server/tests/cierre.test.js#L42)<br>[autenticacion.test.jsx:207](../client/tests/autenticacion.test.jsx#L207) |
| 4 | Cierre de sesión con la sesión ya expirada | [cierre.test.js:56](../server/tests/cierre.test.js#L56) |

## HU-19 — Mantener la sesión activa durante el uso

| # | Escenario | Pruebas |
|---|---|---|
| 1 | Sesión renovada mientras el usuario está activo | [sesion.test.js:170](../server/tests/sesion.test.js#L170)<br>[autenticacion.test.jsx:186](../client/tests/autenticacion.test.jsx#L186) |
| 2 | Regreso después de una pausa corta | [sesion.test.js:179](../server/tests/sesion.test.js#L179) |
| 3 | Sesión cerrada desde otro dispositivo | [sesion.test.js:139](../server/tests/sesion.test.js#L139)<br>[autenticacion.test.jsx:172](../client/tests/autenticacion.test.jsx#L172) |
| 4 | Límite máximo de la sesión | [sesion.test.js:195](../server/tests/sesion.test.js#L195) |

## HU-20 — Gestionar mi perfil

| # | Escenario | Pruebas |
|---|---|---|
| 1 | Actualización exitosa del nombre | [perfil.test.js:19](../server/tests/perfil.test.js#L19)<br>[perfil.test.jsx:33](../client/tests/perfil.test.jsx#L33) |
| 2 | Cambio de moneda principal | [perfil.test.js:41](../server/tests/perfil.test.js#L41)<br>[perfil.test.jsx:49](../client/tests/perfil.test.jsx#L49) |
| 3 | Nombre inválido rechazado | [perfil.test.js:64](../server/tests/perfil.test.js#L64)<br>[perfil.test.jsx:62](../client/tests/perfil.test.jsx#L62) |
| 4 | Correo no editable | [perfil.test.js:75](../server/tests/perfil.test.js#L75)<br>[perfil.test.jsx:74](../client/tests/perfil.test.jsx#L74) |

## HU-21 — Cambiar mi contraseña

| # | Escenario | Pruebas |
|---|---|---|
| 1 | Cambio exitoso de contraseña | [perfil.test.js:120](../server/tests/perfil.test.js#L120)<br>[perfil.test.jsx:97](../client/tests/perfil.test.jsx#L97) |
| 2 | Cierre de las demás sesiones | [perfil.test.js:135](../server/tests/perfil.test.js#L135) |
| 3 | Contraseña actual incorrecta | [perfil.test.js:148](../server/tests/perfil.test.js#L148)<br>[perfil.test.jsx:113](../client/tests/perfil.test.jsx#L113) |
| 4 | Nueva contraseña igual a la actual | [perfil.test.js:161](../server/tests/perfil.test.js#L161)<br>[perfil.test.jsx:128](../client/tests/perfil.test.jsx#L128) |

## HU-04 — Control de acceso basado en roles

| # | Escenario | Pruebas |
|---|---|---|
| 1 | Restricción de acceso para usuario estándar | [admin.test.js:70](../server/tests/admin.test.js#L70)<br>[administracion.test.jsx:46](../client/tests/administracion.test.jsx#L46) |
| 2 | Administración autorizada para usuario administrador | [admin.test.js:111](../server/tests/admin.test.js#L111)<br>[movimientos.test.js:561](../server/tests/movimientos.test.js#L561) |
| 3 | Operación rechazada por falta de permisos | [admin.test.js:87](../server/tests/admin.test.js#L87) |
| 4 | Denegación tras degradación de rol durante una sesión | [admin.test.js:116](../server/tests/admin.test.js#L116)<br>[administracion.test.jsx:59](../client/tests/administracion.test.jsx#L59) |

## HU-05 — Privacidad de mis datos financieros

| # | Escenario | Pruebas |
|---|---|---|
| 1 | Consulta de solo mis propios datos | [movimientos.test.js:613](../server/tests/movimientos.test.js#L613) |
| 2 | Nuevo registro visible solo para su propietario | [categorias.test.js:399](../server/tests/categorias.test.js#L399) |
| 3 | Acceso rechazado a un movimiento de otro usuario | [movimientos.test.js:260](../server/tests/movimientos.test.js#L260) |
| 4 | Usuarios con categorías de igual nombre | [dashboard.test.js:138](../server/tests/dashboard.test.js#L138) |

## HU-22 — Consultar datos de usuarios en modo de solo lectura

| # | Escenario | Pruebas |
|---|---|---|
| 1 | Consulta de los datos de un usuario | [administracion.test.jsx:111](../client/tests/administracion.test.jsx#L111)<br>[presupuestos.test.jsx:342](../client/tests/presupuestos.test.jsx#L342) |
| 2 | Búsqueda de usuarios | [admin.test.js:132](../server/tests/admin.test.js#L132)<br>[administracion.test.jsx:80](../client/tests/administracion.test.jsx#L80) |
| 3 | Modificación de datos ajenos rechazada | [admin.test.js:176](../server/tests/admin.test.js#L176)<br>[movimientos.test.js:598](../server/tests/movimientos.test.js#L598) |
| 4 | Usuario sin información registrada | [movimientos.test.js:587](../server/tests/movimientos.test.js#L587)<br>[administracion.test.jsx:111](../client/tests/administracion.test.jsx#L111) |

## HU-23 — Gestionar roles de usuarios

| # | Escenario | Pruebas |
|---|---|---|
| 1 | Promoción de un usuario a administrador | [admin.test.js:218](../server/tests/admin.test.js#L218)<br>[administracion.test.jsx:222](../client/tests/administracion.test.jsx#L222) |
| 2 | Degradación de otro administrador | [admin.test.js:227](../server/tests/admin.test.js#L227)<br>[administracion.test.jsx:268](../client/tests/administracion.test.jsx#L268) |
| 3 | Cambio de rol sin confirmar | [administracion.test.jsx:238](../client/tests/administracion.test.jsx#L238) |
| 4 | Degradación del último administrador rechazada | [admin.test.js:240](../server/tests/admin.test.js#L240)<br>[administracion.test.jsx:249](../client/tests/administracion.test.jsx#L249) |

## HU-06 — Administrar categorías de ingresos y gastos

| # | Escenario | Pruebas |
|---|---|---|
| 1 | Creación exitosa de una categoría | [categorias.test.js:33](../server/tests/categorias.test.js#L33)<br>[categorias.test.jsx:95](../client/tests/categorias.test.jsx#L95) |
| 2 | Edición exitosa de una categoría existente | [categorias.test.js:68](../server/tests/categorias.test.js#L68)<br>[categorias.test.jsx:169](../client/tests/categorias.test.jsx#L169) |
| 3 | Creación rechazada por nombre de categoría duplicado | [categorias.test.js:99](../server/tests/categorias.test.js#L99)<br>[categorias.test.jsx:135](../client/tests/categorias.test.jsx#L135) |
| 4 | Eliminación impedida por movimientos asociados | [categorias.test.js:131](../server/tests/categorias.test.js#L131)<br>[categorias.test.jsx:237](../client/tests/categorias.test.jsx#L237) |

## HU-24 — Recibir categorías predeterminadas

| # | Escenario | Pruebas |
|---|---|---|
| 1 | Categorías disponibles tras el registro | [categorias.test.js:223](../server/tests/categorias.test.js#L223)<br>[categorias.test.jsx:56](../client/tests/categorias.test.jsx#L56) |
| 2 | Edición sin afectar a otros usuarios | [categorias.test.js:240](../server/tests/categorias.test.js#L240) |
| 3 | Falla al crear las categorías iniciales | [categorias.test.js:292](../server/tests/categorias.test.js#L292) |
| 4 | Categoría predeterminada eliminada | [categorias.test.js:250](../server/tests/categorias.test.js#L250) |

## HU-07 — Administrar cuentas o medios de pago

| # | Escenario | Pruebas |
|---|---|---|
| 1 | Registro exitoso de una cuenta o medio de pago | [cuentas.test.js:44](../server/tests/cuentas.test.js#L44)<br>[cuentas.test.jsx:103](../client/tests/cuentas.test.jsx#L103) |
| 2 | Edición exitosa de una cuenta existente | [cuentas.test.js:116](../server/tests/cuentas.test.js#L116)<br>[cuentas.test.jsx:167](../client/tests/cuentas.test.jsx#L167) |
| 3 | Registro rechazado por nombre de cuenta vacío | [cuentas.test.js:65](../server/tests/cuentas.test.js#L65)<br>[cuentas.test.jsx:129](../client/tests/cuentas.test.jsx#L129) |
| 4 | Eliminación impedida por movimientos asociados | [cuentas.test.js:146](../server/tests/cuentas.test.js#L146)<br>[cuentas.test.jsx:242](../client/tests/cuentas.test.jsx#L242) |

## HU-25 — Definir moneda y saldo inicial de la cuenta

| # | Escenario | Pruebas |
|---|---|---|
| 1 | Cuenta creada en otra moneda | [cuentas.test.js:190](../server/tests/cuentas.test.js#L190)<br>[cuentas.test.jsx:103](../client/tests/cuentas.test.jsx#L103) |
| 2 | Corrección del saldo inicial | [cuentas.test.js:218](../server/tests/cuentas.test.js#L218)<br>[cuentas.test.jsx:167](../client/tests/cuentas.test.jsx#L167) |
| 3 | Moneda no seleccionada | [cuentas.test.js:197](../server/tests/cuentas.test.js#L197)<br>[cuentas.test.jsx:119](../client/tests/cuentas.test.jsx#L119) |
| 4 | Cambio de moneda impedido en una cuenta con movimientos | [cuentas.test.js:258](../server/tests/cuentas.test.js#L258)<br>[cuentas.test.jsx:192](../client/tests/cuentas.test.jsx#L192) |

## HU-08 — Registrar movimiento financiero (ingreso o gasto)

| # | Escenario | Pruebas |
|---|---|---|
| 1 | Registro exitoso de un movimiento financiero | [movimientos.test.js:64](../server/tests/movimientos.test.js#L64)<br>[movimientos.test.jsx:218](../client/tests/movimientos.test.jsx#L218) |
| 2 | Actualización automática de indicadores tras registrar un ingreso | [movimientos.test.js:97](../server/tests/movimientos.test.js#L97)<br>[movimientos.test.jsx:245](../client/tests/movimientos.test.jsx#L245) |
| 3 | Registro rechazado por monto o fecha inválidos | [movimientos.test.js:108](../server/tests/movimientos.test.js#L108)<br>[movimientos.test.jsx:276](../client/tests/movimientos.test.jsx#L276) |
| 4 | Registro permitido con saldo insuficiente y advertencia | [movimientos.test.js:129](../server/tests/movimientos.test.js#L129)<br>[movimientos.test.jsx:304](../client/tests/movimientos.test.jsx#L304) |

## HU-09 — Editar/Eliminar movimiento (HU adicional)

| # | Escenario | Pruebas |
|---|---|---|
| 1 | Edición exitosa de un movimiento propio | [movimientos.test.js:177](../server/tests/movimientos.test.js#L177)<br>[movimientos.test.js:191](../server/tests/movimientos.test.js#L191)<br>[movimientos.test.jsx:378](../client/tests/movimientos.test.jsx#L378) |
| 2 | Eliminación exitosa de un movimiento propio | [movimientos.test.js:200](../server/tests/movimientos.test.js#L200)<br>[movimientos.test.jsx:423](../client/tests/movimientos.test.jsx#L423) |
| 3 | Edición rechazada por datos inválidos | [movimientos.test.js:215](../server/tests/movimientos.test.js#L215)<br>[movimientos.test.jsx:409](../client/tests/movimientos.test.jsx#L409) |
| 4 | Operación rechazada sobre un movimiento de otro usuario | [movimientos.test.js:260](../server/tests/movimientos.test.js#L260) |

## HU-26 — Mantener el saldo de la cuenta consistente

| # | Escenario | Pruebas |
|---|---|---|
| 1 | Saldo coherente tras varias operaciones | [movimientos.test.js:278](../server/tests/movimientos.test.js#L278) |
| 2 | Saldo resultante en el historial | [movimientos.test.js:317](../server/tests/movimientos.test.js#L317)<br>[movimientos.test.jsx:94](../client/tests/movimientos.test.jsx#L94) |
| 3 | Registro interrumpido no altera el saldo | [movimientos.test.js:348](../server/tests/movimientos.test.js#L348) |
| 4 | Movimiento registrado con fecha anterior | [movimientos.test.js:362](../server/tests/movimientos.test.js#L362) |

## HU-27 — Validar la coherencia del movimiento

| # | Escenario | Pruebas |
|---|---|---|
| 1 | Movimiento registrado en la moneda de su cuenta | [movimientos.test.js:417](../server/tests/movimientos.test.js#L417) |
| 2 | Cambio de cuenta al editar un movimiento | [movimientos.test.js:425](../server/tests/movimientos.test.js#L425)<br>[movimientos.test.jsx:400](../client/tests/movimientos.test.jsx#L400) |
| 3 | Categoría incompatible con el tipo | [movimientos.test.js:440](../server/tests/movimientos.test.js#L440)<br>[movimientos.test.jsx:317](../client/tests/movimientos.test.jsx#L317) |
| 4 | Fecha futura rechazada | [movimientos.test.js:477](../server/tests/movimientos.test.js#L477)<br>[movimientos.test.jsx:330](../client/tests/movimientos.test.jsx#L330) |

## HU-10 — Consultar historial de movimientos financieros

| # | Escenario | Pruebas |
|---|---|---|
| 1 | Consulta exitosa del historial de movimientos | [consulta-movimientos.test.js:29](../server/tests/consulta-movimientos.test.js#L29)<br>[movimientos.test.jsx:94](../client/tests/movimientos.test.jsx#L94) |
| 2 | Visualización del detalle de un movimiento | [consulta-movimientos.test.js:63](../server/tests/consulta-movimientos.test.js#L63)<br>[movimientos.test.jsx:155](../client/tests/movimientos.test.jsx#L155) |
| 3 | Error controlado al cargar el historial | [movimientos.test.jsx:119](../client/tests/movimientos.test.jsx#L119) |
| 4 | Visualización del historial sin movimientos | [consulta-movimientos.test.js:90](../server/tests/consulta-movimientos.test.js#L90)<br>[movimientos.test.jsx:167](../client/tests/movimientos.test.jsx#L167) |

## HU-11 — Filtrar movimientos por fecha, categoría y tipo

| # | Escenario | Pruebas |
|---|---|---|
| 1 | Filtrado exitoso por fecha y categoría | [consulta-movimientos.test.js:116](../server/tests/consulta-movimientos.test.js#L116)<br>[movimientos.test.jsx:174](../client/tests/movimientos.test.jsx#L174) |
| 2 | Combinación exitosa de filtros | [consulta-movimientos.test.js:121](../server/tests/consulta-movimientos.test.js#L121) |
| 3 | Filtro rechazado por rango de fechas inválido | [consulta-movimientos.test.js:127](../server/tests/consulta-movimientos.test.js#L127)<br>[movimientos.test.jsx:190](../client/tests/movimientos.test.jsx#L190) |
| 4 | Resultado vacío por filtros sin coincidencias | [consulta-movimientos.test.js:136](../server/tests/consulta-movimientos.test.js#L136)<br>[movimientos.test.jsx:200](../client/tests/movimientos.test.jsx#L200) |

## HU-12 — Visualizar indicadores financieros en el dashboard

| # | Escenario | Pruebas |
|---|---|---|
| 1 | Visualización exitosa de indicadores del período actual | [dashboard.test.js:32](../server/tests/dashboard.test.js#L32)<br>[dashboard.test.jsx:65](../client/tests/dashboard.test.jsx#L65) |
| 2 | Actualización de indicadores al cambiar el período | [dashboard.test.js:53](../server/tests/dashboard.test.js#L53)<br>[dashboard.test.jsx:76](../client/tests/dashboard.test.jsx#L76) |
| 3 | Error controlado al cargar indicadores | [dashboard.test.jsx:116](../client/tests/dashboard.test.jsx#L116) |
| 4 | Indicadores en cero cuando no existen movimientos | [dashboard.test.js:65](../server/tests/dashboard.test.js#L65)<br>[dashboard.test.jsx:88](../client/tests/dashboard.test.jsx#L88) |

## HU-13 — Visualizar gráficos financieros interactivos

| # | Escenario | Pruebas |
|---|---|---|
| 1 | Visualización exitosa de gráficos financieros | [dashboard.test.js:157](../server/tests/dashboard.test.js#L157)<br>[dashboard.test.jsx:133](../client/tests/dashboard.test.jsx#L133) |
| 2 | Consulta de detalles mediante tooltip interactivo | [dashboard.test.jsx:145](../client/tests/dashboard.test.jsx#L145) |
| 3 | Error controlado al generar gráficos | [dashboard.test.jsx:165](../client/tests/dashboard.test.jsx#L165) |
| 4 | Estado vacío del gráfico sin gastos registrados | [dashboard.test.js:179](../server/tests/dashboard.test.js#L179)<br>[dashboard.test.jsx:174](../client/tests/dashboard.test.jsx#L174) |

## HU-28 — Ver el dashboard por moneda

| # | Escenario | Pruebas |
|---|---|---|
| 1 | Dashboard en la moneda principal | [dashboard.test.js:105](../server/tests/dashboard.test.js#L105)<br>[dashboard.test.jsx:187](../client/tests/dashboard.test.jsx#L187) |
| 2 | Cambio de moneda en el dashboard | [dashboard.test.js:124](../server/tests/dashboard.test.js#L124)<br>[dashboard.test.jsx:194](../client/tests/dashboard.test.jsx#L194) |
| 3 | Error al cambiar de moneda | [dashboard.test.jsx:206](../client/tests/dashboard.test.jsx#L206) |
| 4 | Selector limitado a las monedas en uso | [dashboard.test.js:115](../server/tests/dashboard.test.js#L115)<br>[dashboard.test.jsx:219](../client/tests/dashboard.test.jsx#L219) |

## HU-14 — Definir presupuesto mensual

| # | Escenario | Pruebas |
|---|---|---|
| 1 | Definición exitosa de presupuesto mensual | [presupuestos.test.js:42](../server/tests/presupuestos.test.js#L42)<br>[presupuestos.test.jsx:151](../client/tests/presupuestos.test.jsx#L151) |
| 2 | Asignación exitosa de presupuesto por categoría | [presupuestos.test.js:61](../server/tests/presupuestos.test.js#L61)<br>[presupuestos.test.jsx:165](../client/tests/presupuestos.test.jsx#L165) |
| 3 | Presupuesto rechazado por monto inválido | [presupuestos.test.js:69](../server/tests/presupuestos.test.js#L69)<br>[presupuestos.test.jsx:182](../client/tests/presupuestos.test.jsx#L182) |
| 4 | Confirmación para reemplazar un presupuesto existente | [presupuestos.test.js:76](../server/tests/presupuestos.test.js#L76)<br>[presupuestos.test.jsx:191](../client/tests/presupuestos.test.jsx#L191) |

## HU-15 — Seguimiento del cumplimiento del presupuesto

| # | Escenario | Pruebas |
|---|---|---|
| 1 | Visualización exitosa del avance del presupuesto | [presupuestos.test.js:224](../server/tests/presupuestos.test.js#L224)<br>[presupuestos.test.jsx:93](../client/tests/presupuestos.test.jsx#L93) |
| 2 | Notificación al alcanzar el umbral de alerta | [presupuestos.test.js:233](../server/tests/presupuestos.test.js#L233)<br>[presupuestos.test.jsx:319](../client/tests/presupuestos.test.jsx#L319) |
| 3 | Seguimiento no disponible sin presupuesto definido | [presupuestos.test.js:284](../server/tests/presupuestos.test.js#L284)<br>[presupuestos.test.jsx:112](../client/tests/presupuestos.test.jsx#L112) |
| 4 | Visualización del presupuesto excedido | [presupuestos.test.js:247](../server/tests/presupuestos.test.js#L247)<br>[presupuestos.test.jsx:103](../client/tests/presupuestos.test.jsx#L103) |

## HU-29 — Definir presupuestos por moneda y período

| # | Escenario | Pruebas |
|---|---|---|
| 1 | Presupuestos independientes por moneda | [presupuestos.test.js:102](../server/tests/presupuestos.test.js#L102)<br>[presupuestos.test.jsx:119](../client/tests/presupuestos.test.jsx#L119) |
| 2 | Gastos en otra moneda no cuentan | [presupuestos.test.js:113](../server/tests/presupuestos.test.js#L113) |
| 3 | Mes pasado rechazado | [presupuestos.test.js:123](../server/tests/presupuestos.test.js#L123)<br>[presupuestos.test.jsx:257](../client/tests/presupuestos.test.jsx#L257) |
| 4 | Presupuesto en una moneda sin gastos | [presupuestos.test.js:133](../server/tests/presupuestos.test.js#L133) |

## HU-30 — Mantener los presupuestos por categoría dentro del general

| # | Escenario | Pruebas |
|---|---|---|
| 1 | Presupuesto por categoría dentro del general | [presupuestos.test.js:148](../server/tests/presupuestos.test.js#L148) |
| 2 | Gasto sin presupuesto de categoría | [presupuestos.test.js:157](../server/tests/presupuestos.test.js#L157) |
| 3 | Suma superior al presupuesto general | [presupuestos.test.js:184](../server/tests/presupuestos.test.js#L184)<br>[presupuestos.test.jsx:269](../client/tests/presupuestos.test.jsx#L269) |
| 4 | Reducción del general por debajo de lo asignado | [presupuestos.test.js:192](../server/tests/presupuestos.test.js#L192) |

## HU-16 — Exportar reporte financiero en PDF

| # | Escenario | Pruebas |
|---|---|---|
| 1 | Exportación exitosa de reporte financiero en PDF | [reportes.test.js:108](../server/tests/reportes.test.js#L108)<br>[reportes.test.jsx:73](../client/tests/reportes.test.jsx#L73) |
| 2 | Exportación con período por defecto | [reportes.test.js:119](../server/tests/reportes.test.js#L119)<br>[reportes.test.jsx:85](../client/tests/reportes.test.jsx#L85) |
| 3 | Exportación deshabilitada sin datos disponibles | [reportes.test.jsx:92](../client/tests/reportes.test.jsx#L92)<br>[reportes.test.jsx:124](../client/tests/reportes.test.jsx#L124) |
| 4 | Generación controlada de PDF con alto volumen de movimientos | [reportes.test.jsx:99](../client/tests/reportes.test.jsx#L99) |

## HU-17 — Exportar reporte financiero en Excel

| # | Escenario | Pruebas |
|---|---|---|
| 1 | Exportación exitosa de movimientos a Excel | [reportes.test.js:47](../server/tests/reportes.test.js#L47)<br>[reportes.test.jsx:134](../client/tests/reportes.test.jsx#L134) |
| 2 | Exportación con resumen por categoría y tipo | [reportes.test.js:76](../server/tests/reportes.test.js#L76) |
| 3 | Exportación deshabilitada sin datos disponibles | [reportes.test.js:99](../server/tests/reportes.test.js#L99)<br>[reportes.test.jsx:92](../client/tests/reportes.test.jsx#L92) |
| 4 | Cancelación segura de descarga ante interrupción de conexión | [reportes.test.jsx:144](../client/tests/reportes.test.jsx#L144) |

## HU-31 — Exportar reportes separados por moneda

| # | Escenario | Pruebas |
|---|---|---|
| 1 | Reporte Excel con varias monedas | [reportes.test.js:149](../server/tests/reportes.test.js#L149) |
| 2 | Reporte PDF con totales por moneda | [reportes.test.js:129](../server/tests/reportes.test.js#L129) |
| 3 | Excel que supera el límite | [reportes.test.js:160](../server/tests/reportes.test.js#L160)<br>[reportes.test.jsx:160](../client/tests/reportes.test.jsx#L160) |
| 4 | Reporte aislado por usuario | [reportes.test.js:176](../server/tests/reportes.test.js#L176) |

## HU-32 — Elegir el idioma de la aplicación

| # | Escenario | Pruebas |
|---|---|---|
| 1 | Cambio del idioma a inglés | [preferencias.test.js:45](../server/tests/preferencias.test.js#L45)<br>[preferencias.test.jsx:70](../client/tests/preferencias.test.jsx#L70) |
| 2 | Idioma antes de iniciar sesión | [preferencias.test.js:58](../server/tests/preferencias.test.js#L58)<br>[preferencias.test.jsx:103](../client/tests/preferencias.test.jsx#L103) |
| 3 | Mensajes de error en el idioma elegido | [preferencias.test.js:69](../server/tests/preferencias.test.js#L69)<br>[preferencias.test.jsx:122](../client/tests/preferencias.test.jsx#L122) |
| 4 | Correos y reportes en el idioma elegido | [preferencias.test.js:96](../server/tests/preferencias.test.js#L96)<br>[preferencias.test.js:107](../server/tests/preferencias.test.js#L107) |

## HU-33 — Usar la aplicación de forma accesible

| # | Escenario | Pruebas |
|---|---|---|
| 1 | Registro de un movimiento solo con teclado | [preferencias.test.jsx:235](../client/tests/preferencias.test.jsx#L235) |
| 2 | Texto grande y alto contraste | [preferencias.test.js:178](../server/tests/preferencias.test.js#L178)<br>[preferencias.test.jsx:291](../client/tests/preferencias.test.jsx#L291) |
| 3 | Errores anunciados al lector de pantalla | [preferencias.test.jsx:355](../client/tests/preferencias.test.jsx#L355) |
| 4 | Gráficos y pantallas sin barreras | [preferencias.test.jsx:401](../client/tests/preferencias.test.jsx#L401) |
