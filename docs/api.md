# Referencia de la API REST

API del Dashboard de Finanzas Personales. Todas las rutas cuelgan de `/api/v1` y, salvo registro, inicio de sesión, recuperación de contraseña y salud, requieren sesión.

## Convenciones

- **Respuestas** (RT-02): éxito `{ "data": … }` (con `meta` opcional para advertencias y alertas); listados `{ "data": [ … ], "meta": { "page", "limit", "total", "totalPages" } }`; error `{ "error": { "code", "message", "details" } }` con `details` por campo en las validaciones.
- **Códigos HTTP**: 200, 201 y 204 en éxito; 400 validación (`VALIDATION_ERROR`), 401 sin sesión o sesión vencida, 403 rol insuficiente, 404 inexistente **o de otro usuario** (`NOT_FOUND`, sin distinguir), 409 conflicto de negocio, 429 demasiados intentos y 500 error interno sin detalles.
- **Identificadores** (RT-08): cada recurso se identifica con un UUID v4 generado por el servidor (`"id": "3f2504e0-4f89-41d3-9a0c-0305e82c3301"`). Un identificador mal formado responde 404 en la ruta y 400 "El identificador no es válido" en el cuerpo.
- **Montos**: viajan como texto con dos decimales (`"1250.50"`) junto a su moneda (PEN, USD o EUR); se guardan como `Decimal128`.
- **Fechas**: `AAAA-MM-DD` y períodos `AAAA-MM`, en la zona horaria `APP_TIMEZONE` (por defecto `America/Lima`), manejadas con Day.js.
- **Paginación** (RT-03): `page` (desde 1), `limit` (máximo 100) y `sort` (`campo` o `-campo`).
- **Idioma**: los mensajes salen en el idioma del usuario o, sin sesión, en el de `Accept-Language` (`es` o `en`).
- **Salud**: `GET /api/v1/health` informa si la API y la base de datos están disponibles.

## Autenticación

Rutas de `/api/v1/auth` (diseño completo en `openspec/changes/archive/2026-11-21-implementar-autenticacion/design.md`):

| Método y ruta | Qué hace |
|---|---|
| `POST /registro` | Crea la cuenta (rol `usuario`) y envía el correo de bienvenida. |
| `POST /login` | Inicia sesión y fija las cookies. Tres fallos seguidos bloquean la cuenta 5 minutos (429). |
| `GET /me` | Devuelve la persona con la sesión actual. |
| `POST /refresh` | Renueva el token de acceso (rota el token de renovación). |
| `POST /logout` | Cierra solo la sesión de este dispositivo; responde 204 aunque ya haya expirado. |
| `POST /olvide-contrasena` | Responde siempre igual, exista o no el correo. Un enlace cada 60 segundos. |
| `POST /restablecer-contrasena` | Cambia la contraseña con el enlace (un solo uso) y cierra todas las sesiones. |

Perfil (requiere sesión; actúa siempre sobre la persona autenticada, sin identificador en la ruta):

| Método y ruta | Qué hace |
|---|---|
| `PATCH /api/v1/perfil` | Actualiza `nombre` y `monedaPrincipal` (PEN, USD o EUR). El correo, el rol y el tenant se ignoran. |
| `PUT /api/v1/perfil/contrasena` | Cambia la contraseña con `passwordActual` y `passwordNueva`: rechaza la actual incorrecta (400) y la nueva igual a la actual (400), cierra las demás sesiones y conserva la actual. Los intentos fallidos con la actual comparten el límite de 3 del inicio de sesión (429). |

- **Cookies** `httpOnly` con `sameSite=lax` (`secure` en producción): `access_token` (JWT de 15 minutos) y `refresh_token` (opaco, solo en `/api/v1/auth`). Solo el hash de este último se guarda en la base.
- **Tiempos:** la sesión caduca tras 30 minutos sin actividad (`REFRESH_INACTIVITY_MIN`) y, en todo caso, a los 7 días (`REFRESH_ABSOLUTE_DAYS`). El enlace de recuperación vence a los 30 minutos (`RESET_TOKEN_TTL_MIN`).
- **Errores de sesión:** `TOKEN_EXPIRED` (el cliente renueva solo), `SESSION_EXPIRED` y `SESSION_REVOKED` (hay que iniciar sesión de nuevo).
- **Sin SMTP configurado** los correos se escriben en el log del servidor, con el enlace de recuperación incluido: sirve para probar el flujo en local.
- **Correo real (Brevo u otro):** define `SMTP_*` y `MAIL_FROM` en `server/.env`. Gmail y otros proveedores pueden enviar estos mensajes a la carpeta de spam la primera vez; pide a quien pruebe que revise esa carpeta o marque el remitente como seguro.
- **Límites conocidos:** no hay límite por IP (solo el bloqueo por cuenta y el enfriamiento de los correos); es una mejora futura que no cambia el contrato.

## Administración y roles

Rutas de `/api/v1/admin` (solo rol `admin`; el rol se lee de la base en cada solicitud, así que una degradación se aplica de inmediato):

| Método y ruta | Qué hace |
|---|---|
| `GET /usuarios?q=&page=&limit=&sort=` | Lista usuarios paginados; `q` busca por nombre o correo (texto literal). |
| `GET /usuarios/:id` | Datos de un usuario, sin información sensible. |
| `PATCH /usuarios/:id/rol` | Cambia el rol (`usuario` o `admin`). Responde 409 "Debe existir al menos un administrador" si dejaría al sistema sin ninguno; la comprobación es atómica (transacción con documento centinela). |

- Un usuario estándar recibe 403 "Acceso no autorizado", y cada denegación queda en el log. La autorización se comprueba en el middleware `requerirRol` y otra vez en el servicio.
- Para leer datos financieros de otra persona, las rutas `GET` de administración usan `RepositorioLectura` (sin métodos de escritura). Las rutas de escritura siempre usan el `tenantId` de quien llama, por lo que editar un recurso ajeno responde 404.
- Los administradores adicionales se promueven desde "Administración"; el primero se crea con `npm run seed:admin -w server`.

## Categorías

Rutas de `/api/v1/categorias` (sesión obligatoria; cada persona solo ve y modifica las suyas, y una ajena responde 404):

| Método y ruta | Qué hace |
|---|---|
| `GET /categorias?tipo=&page=&limit=&sort=` | Lista paginada; por defecto ordena por tipo y nombre (sin distinguir tildes ni mayúsculas). La pantalla pide `limit=100`. |
| `POST /categorias` | Crea una categoría (`nombre` de 2 a 50 caracteres, `tipo` `gasto` o `ingreso`, `icono` de la lista cerrada de `@finanzas/shared`). 409 "Ya existe una categoría con ese nombre" si se repite el nombre en el mismo tipo; la unicidad la impone un índice único de MongoDB. |
| `PATCH /categorias/:id` | Cambia `nombre` o `icono`. El tipo no se puede cambiar. |
| `DELETE /categorias/:id` | Elimina la categoría; 409 si tiene movimientos asociados (se comprueba contra la colección `movimientos`). |

- Al registrarse, cada usuario recibe 10 categorías propias (7 de gasto y 3 de ingreso) creadas en la **misma transacción** que la cuenta: si falla algo no queda una cuenta a medias. Iniciar sesión nunca las repone.
- Las cuentas registradas **antes** de este cambio (solo datos de desarrollo) no tienen categorías: se obtienen registrándose de nuevo o con `npm run seed -w server`.
- Administración las lee con `GET /admin/usuarios/:id/categorias` (solo lectura) y las muestra en el detalle de cada usuario.

## Cuentas

Rutas de `/api/v1/cuentas` (sesión obligatoria; cada persona solo ve y modifica las suyas, y una ajena responde 404):

| Método y ruta | Qué hace |
|---|---|
| `GET /cuentas?tipo=&moneda=&page=&limit=&sort=` | Lista paginada; por defecto ordena por nombre (sin distinguir tildes ni mayúsculas). La pantalla pide `limit=100`. |
| `POST /cuentas` | Crea una cuenta (`nombre` de 2 a 50 caracteres, `tipo` efectivo, banco, tarjeta de crédito o billetera digital, `moneda` PEN, USD o EUR y `saldoInicial` opcional, que puede ser negativo). Su saldo actual empieza igual al inicial. 409 "Ya existe una cuenta con ese nombre" si se repite; la unicidad la impone un índice único de MongoDB. |
| `GET /cuentas/:id` | Una cuenta propia. |
| `PATCH /cuentas/:id` | Cambia `nombre`, `tipo`, `moneda` o `saldoInicial`. Corregir el saldo inicial mueve el saldo actual en la misma diferencia (100.00 a 120.00 con saldo actual 70.00 lo deja en 90.00) en una transacción. 409 si se cambia la moneda de una cuenta con movimientos. |
| `DELETE /cuentas/:id` | Elimina la cuenta; 409 si tiene movimientos asociados (se comprueba contra la colección `movimientos`). |

- Los saldos viajan como texto con dos decimales (`"1250.50"`), se guardan como `Decimal128` y se calculan con `decimal.js`.
- Administración las lee con `GET /admin/usuarios/:id/cuentas` (solo lectura) y las muestra en el detalle de cada usuario.

## Movimientos

Rutas de `/api/v1/movimientos` (sesión obligatoria; cada persona solo ve y modifica los suyos, y uno ajeno responde 404):

| Método y ruta | Qué hace |
|---|---|
| `GET /movimientos?desde=&hasta=&tipo=&categoriaId=&cuentaId=&moneda=&sort=&page=&limit=` | Historial paginado (por defecto `-fecha`; también `fecha`, `monto` y `-monto`). Cada movimiento trae `saldoResultante`, el saldo que dejó en su cuenta, calculado por fecha y orden de registro **antes** de aplicar los filtros. |
| `POST /movimientos` | Registra un ingreso o gasto (`tipo`, `monto`, `fecha` AAAA-MM-DD sin fechas futuras, `categoriaId`, `cuentaId`, `descripcion` opcional). La moneda es la de la cuenta. Un gasto que supera el saldo se registra igual y la respuesta lleva `meta.advertencias`. |
| `GET /movimientos/:id` | Un movimiento propio. |
| `PATCH /movimientos/:id` | Cambia cualquier subconjunto de campos; se valida el resultado completo. Cambiar de cuenta mueve el saldo entre ambas y adopta la moneda de la nueva. |
| `DELETE /movimientos/:id` | Elimina el movimiento y revierte su efecto en el saldo. |

- Crear, editar y eliminar son **una transacción** que guarda el movimiento y ajusta `saldoActual`; si algo falla no queda nada a medias. El saldo siempre es `saldoInicial + ingresos − gastos`, y cada operación lo comprueba y lo corrige (con un aviso en el log) si no coincide.
- La categoría debe ser del mismo tipo que el movimiento ("Selecciona una categoría de ingreso" o "de gasto") y la cuenta y la categoría deben ser propias.
- Administración los lee con `GET /admin/usuarios/:id/movimientos` (solo lectura) y los muestra en el detalle de cada usuario.
- El historial del cliente (HU-10, HU-11) abre el detalle de cada movimiento y se filtra por rango de fechas, tipo, categoría y cuenta con "Aplicar filtros" y "Limpiar filtros". Un rango con la fecha inicial mayor que la final se avisa y no se aplica; los filtros se envían como parámetros de `GET /movimientos` y el saldo resultante no cambia al filtrar.
- `npm run verificar-saldos -w server` compara el saldo guardado de cada cuenta con la fórmula, lista las que difieren y termina con código 1 si hay alguna. Solo lee.

## Presupuestos

Rutas de `/api/v1/presupuestos` (sesión obligatoria; cada persona solo ve y modifica los suyos, y uno ajeno responde 404):

| Método y ruta | Qué hace |
|---|---|
| `GET /presupuestos?periodo=&moneda=&sort=&page=&limit=` | Lista los presupuestos (también los de meses pasados). |
| `GET /presupuestos/seguimiento?periodo=&moneda=` | Cada presupuesto del mes (por defecto el actual) con `gastado`, `restante`, `porcentaje`, `excedido`, `sobregiro` y, en el general, `sinAsignar`. |
| `POST /presupuestos` | Define un presupuesto de `periodo` (`AAAA-MM`), `moneda`, `monto` y, opcional, `categoriaId` (sin categoría = general). 409 si ya existe uno para esa clave. |
| `PUT /presupuestos/:id` | Reemplaza el monto (la pantalla pide confirmación antes). |
| `DELETE /presupuestos/:id` | Elimina; un general con presupuestos por categoría responde 409. |

- Hay un presupuesto por mes, moneda y categoría; solo se definen o cambian para el mes actual o futuros. El gasto se mide solo con movimientos de esa moneda y mes.
- Un presupuesto por categoría exige el general del mismo mes y moneda, y la suma de las categorías no puede superarlo ("La suma por categorías supera el presupuesto general"). Un gasto sin presupuesto de categoría cuenta solo para el general.
- Registrar o editar un gasto que cruza el 90 % o el 100 % de un presupuesto agrega `meta.alertas` a la respuesta (una sola vez por cruce, sin guardar estado) y la pantalla muestra el aviso.
- Una categoría con presupuestos no se elimina (409). Administración los lee con `GET /admin/usuarios/:id/presupuestos` (solo lectura) y los muestra en el detalle de cada usuario.

## Dashboard

La pantalla de inicio muestra el resumen del mes y la moneda elegidos. Rutas de `/api/v1/dashboard` (solo lectura, sesión obligatoria, siempre sobre los datos propios):

| Método y ruta | Qué devuelve |
|---|---|
| `GET /dashboard/monedas` | `principal` y las `monedas` de las cuentas de la persona (solo la principal si aún no tiene cuentas). |
| `GET /dashboard/indicadores?periodo=&moneda=` | Ingresos, gastos, balance, `hayMovimientos` y el avance del presupuesto general del mes (o `null`). |
| `GET /dashboard/graficos?periodo=&moneda=` | `evolucion` de los 6 meses que terminan en `periodo` y `distribucion` de los gastos del mes por categoría (las ocho mayores y "Otras"). |

- `periodo` (`AAAA-MM`) es por defecto el mes actual y `moneda` la principal de la persona. No hay conversión entre monedas: cada consulta usa solo los movimientos de una moneda.
- Los indicadores y los gráficos son consultas separadas: si una falla, la otra sigue visible. Cada gráfico (Chart.js) tiene su tabla equivalente.

## Reportes

Desde el historial de movimientos se exportan los movimientos filtrados. Rutas de `/api/v1/reportes` (sesión obligatoria, solo datos propios, respuesta como descarga con `Content-Disposition: attachment`):

| Método y ruta | Archivo |
|---|---|
| `GET /reportes/movimientos.pdf` | PDF (jsPDF): período, ingresos, gastos y balance por moneda, y la tabla de movimientos. |
| `GET /reportes/movimientos.xlsx` | Excel (SheetJS): hoja "Movimientos" y hoja "Resumen" por moneda, tipo y categoría. |

- Reciben los mismos filtros del historial (`desde`, `hasta`, `tipo`, `categoriaId`, `cuentaId`, `moneda`). Sin fechas, el reporte cubre el mes en curso.
- Máximo 5000 movimientos por archivo; sin movimientos o por encima del tope responden 400 con el mensaje que explica qué hacer. El archivo se arma completo antes de responder, así que un fallo nunca deja un archivo a medias.
- SheetJS se instala desde `https://cdn.sheetjs.com/` (el paquete `xlsx` de npm está desactualizado), con la versión fijada en `server/package.json`.
- Los títulos, columnas y totales salen en el idioma de la persona; los nombres que ella escribió (categorías, cuentas, descripciones) no se traducen.

## Idioma y accesibilidad

La aplicación está en español e inglés (HU-32) y se puede usar con teclado, lector de pantalla, texto grande y alto contraste (HU-33).

| Método y ruta | Qué hace |
|---|---|
| `PATCH /perfil/preferencias` | Guarda `idioma` (`es` \| `en`), `textoGrande` y `altoContraste` (al menos uno). Devuelve la persona, igual que `/auth/me`. |

- **Idioma.** Sin sesión sale del navegador y se elige en el pie de las pantallas públicas (queda en `localStorage`); con sesión manda el perfil. El registro guarda el idioma en uso y crea las categorías predeterminadas en ese idioma. El cliente envía `Accept-Language` y la API responde sus mensajes (errores, advertencias) en el idioma del usuario o, sin sesión, en el del encabezado. Los correos y los reportes usan el idioma del usuario.
- **Cómo se traduce.** El español es la fuente. `shared/src/i18n/` tiene `MENSAJES_EN` (misma forma que `MENSAJES`, lo exige una prueba) y `crearTraductor`, que traduce por texto, incluidas las plantillas con valores. En el cliente cada texto va en `t('texto en español')` (`useT()`), con su traducción en `client/src/shared/preferencias/textos.en.js`; una prueba recorre el código y falla si un texto no tiene traducción.
- **Accesibilidad.** "Texto grande" y "Alto contraste" están en *Mi perfil* y se aplican como `data-texto="grande"` y `data-contraste="alto"` en `<html>` (los colores de alto contraste cumplen al menos 7:1). Las pruebas pasan `axe-core` por las pantallas principales (el contraste se calcula aparte, jsdom no pinta), recorren con teclado el registro de un movimiento y comprueban el anuncio de errores.
- **Ver la contraseña.** Todo campo de contraseña (`Campo` con `tipo="password"`) lleva un botón con un ojo, "Mostrar contraseña", que alterna entre texto oculto y visible; anuncia su estado con `aria-pressed` y no envía el formulario.
