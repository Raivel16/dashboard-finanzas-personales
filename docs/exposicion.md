# Guion de la exposición final

Guion para presentar el Dashboard de Finanzas Personales según la **rúbrica de evaluación final de Ingeniería Web**. Cada sección corresponde a un criterio, con su peso: qué mostrar, dónde está la evidencia y qué preguntas preparar. El total suma 21 puntos de peso: 63 puntos brutos se convierten a la escala de 20 o de 100.

| # | Criterio | Peso | Tiempo sugerido |
|---|---|---|---|
| 1 | Demostración funcional del flujo completo MERN | 6 | 7 min |
| 2 | Arquitectura y dominio de la aplicación (Controller – Service – Repository, reglas de negocio, SDD) | 6 | 5 min |
| 3 | Seguridad: JWT, RBAC y aislamiento multiinquilino | 4 | 4 min |
| 4 | Dashboard, filtros y reportes | 3 | 3 min (dentro de la demo) |
| 5 | Calidad de código, UUID, Day.js y diseño responsivo | 2 | 2 min |
| | Preguntas | | 4 min |

## Antes de empezar (lista de verificación)

- [ ] `server/.env` apunta a **MongoDB Atlas** y la IP del equipo de la demo está permitida en *Network Access*.
- [ ] Los datos están cargados: `npm run seed:admin -w server` y `npm run seed -w server -- --permitir-remoto`.
- [ ] El SMTP está configurado (`SMTP_*` y `MAIL_FROM`) y hay acceso al buzón donde llegará el correo de recuperación. Si el correo falla, el enlace aparece en el log del servidor.
- [ ] `npm run dev` está corriendo y la página de inicio indica "API y base de datos disponibles".
- [ ] Ventanas abiertas:
  - Navegador normal con **Ana Torres**.
  - Ventana privada con **Luis Quispe**.
  - Otra ventana privada para el **administrador**.
  - Contraseña de los tres: `Demo1234`.
- [ ] Herramientas de desarrollador abiertas en la pestaña *Network* (para mostrar los códigos HTTP).
- [ ] MongoDB Compass (o el *Data Explorer* de Atlas) conectado a la base `finanzas`, con la colección `movimientos` a la vista.
- [ ] VS Code abierto con los archivos de la sección 2.
- [ ] En GitHub, la pestaña *Actions* del último pull request (CI en verde) y el panel de SonarCloud.

**Plan B**:
- Si falla internet o Atlas, cambiar `MONGODB_URI` a la base local (`mongodb://127.0.0.1:27017/finanzas?directConnection=true`) y ejecutar `npm run seed -w server`. No requiere cambios de código; ese es justamente el escenario "Cambio a MongoDB Atlas" de RT-01.
- Si falla el correo, mostrar el enlace en la consola del servidor.

## 1. Demostración funcional del flujo completo (peso 6)

**Objetivo de la rúbrica (nivel 3):**
- El 100 % de los flujos CRUD funcionan en vivo integrando React, Express y MongoDB.
- Las entradas se validan en cliente y servidor.
- La API responde con códigos HTTP estandarizados y la interfaz da retroalimentación visual.

Recorrido (con Ana Torres, salvo que se indique otra cosa):

1. **Registro y sesión.**
   - Registrar una persona nueva y mostrar que recibe sus 10 categorías predeterminadas.
   - Intentar iniciar sesión 3 veces con una contraseña incorrecta: la cuenta se bloquea 5 minutos (429).
   - Mostrar "¿Olvidaste tu contraseña?": llega el correo con el enlace de un solo uso.
2. **CRUD de cuentas.**
   - Crear "Caja chica" en PEN: notificación y `201` en *Network*.
   - Editarla: `200`.
   - Intentar eliminar una cuenta con movimientos: `409` "No se puede eliminar una cuenta con movimientos asociados".
3. **Validación en cliente y servidor.**
   - Registrar un gasto con monto `0`: el cliente lo bloquea con el mensaje bajo el campo, sin llamar a la API.
   - Para mostrar la validación del servidor, enviar el mismo cuerpo desde la consola con `fetch`. La respuesta es `400 VALIDATION_ERROR` con el detalle por campo; las reglas son las mismas porque viven en `shared/`.
4. **CRUD de movimientos.**
   - Registrar un gasto de "Alimentación": el saldo de la cuenta cambia en el mismo instante. Si cruza el 90 % del presupuesto aparece la alerta.
   - Editarlo.
   - Eliminarlo con la confirmación de SweetAlert2: `204`, y el saldo vuelve a su valor.
5. **Categorías.** Crear una categoría y comprobar que un nombre repetido devuelve `409` "Ya existe una categoría con ese nombre".
6. **Presupuestos.** Mostrar el seguimiento del mes: Transporte normal, Alimentación en alerta y Entretenimiento excedido. Intentar que la suma por categorías supere al general: `400` "La suma por categorías supera el presupuesto general".
7. **Idioma y accesibilidad.** Cambiar a inglés en *Mi perfil*: toda la interfaz, los mensajes de la API y los reportes cambian sin recargar.

Códigos que conviene señalar en *Network*: `200`, `201`, `204`, `400`, `401` (sesión vencida), `403` (rol), `404` (recurso ajeno), `409` (regla de negocio) y `429` (bloqueo).

## 2. Arquitectura y dominio de la aplicación (peso 6)

**Objetivo (nivel 3):**
- Explicar con precisión cómo fluye una petición por Controller, Service y Repository.
- Defender las reglas de negocio.
- Mostrar la trazabilidad entre las especificaciones SDD y el código.

### Recorrido de `POST /api/v1/movimientos`

| Paso | Archivo | Qué decir |
|---|---|---|
| 1 | [app.js](../server/src/app.js) | Monta las rutas bajo `/api/v1` e inyecta las dependencias (servicios, repositorios, reloj y logger). |
| 2 | [movimientos.routes.js](../server/src/routes/movimientos.routes.js) | Toda la ruta pasa por `autenticar`. |
| 3 | [autenticacion.middleware.js](../server/src/middlewares/autenticacion.middleware.js) | Verifica el JWT de la cookie y **vuelve a leer el usuario** para usar su rol vigente; deja `req.usuario` con `tenantId`. |
| 4 | [movimiento.controller.js](../server/src/controllers/movimiento.controller.js) | Solo HTTP: llama a `movimientos.crear(req.usuario, req.body)` y responde `201` con la vista. Nunca toca modelos. |
| 5 | [movimiento.service.js](../server/src/services/movimiento.service.js) | Valida con el esquema compartido y abre una transacción. Comprueba que cuenta y categoría sean del inquilino y del tipo correcto, guarda, ajusta el saldo, lo verifica con la fórmula y calcula las alertas de presupuesto. No conoce `req` ni `res`. |
| 6 | [movimiento.repository.js](../server/src/repositories/movimiento.repository.js) → [base.repository.js](../server/src/repositories/base.repository.js) | Única capa que usa el modelo; `_filtro()` agrega siempre el `tenantId`. |
| 7 | [movimiento.model.js](../server/src/models/movimiento.model.js) + [tenant.plugin.js](../server/src/models/plugins/tenant.plugin.js) | Esquema con `tenantId`, `usuarioId` e identificador UUID. El plugin rechaza cualquier consulta sin `tenantId`. |
| 8 | [movimiento.view.js](../server/src/views/movimiento.view.js) | Arma el JSON público: `id` UUID y montos como texto `"80.00"`. |

### Reglas de negocio para defender

- **Saldo consistente.** Crear, editar y eliminar un movimiento es una sola transacción de MongoDB, que por eso exige un replica set (Atlas lo es). El saldo siempre es `saldo inicial + ingresos − gastos`; cada operación lo verifica y lo corrige con un aviso en el log si no coincide. Los montos se calculan con `decimal.js` y se guardan como `Decimal128`, nunca como `Number` (0.1 + 0.2 ≠ 0.3).
- **Gasto mayor al saldo.** Se registra igual, porque una tarjeta de crédito puede quedar en negativo, pero la respuesta lleva una advertencia en `meta.advertencias`.
- **Presupuestos.**
  - Uno por mes, moneda y categoría.
  - Uno por categoría exige el general, y la suma de las categorías no puede superarlo.
  - Las alertas saltan una sola vez al cruzar el 90 % y el 100 % ([utils/presupuesto.js](../server/src/utils/presupuesto.js)).
- **KPI del dashboard.**
  - Ingresos, gastos y balance del mes y la moneda elegidos, sin convertir entre monedas.
  - Porcentaje usado del presupuesto general.
  - Evolución de 6 meses y distribución de gastos por categoría (las ocho mayores y "Otras") ([dashboard.service.js](../server/src/services/dashboard.service.js)).
- **Categorías y cuentas.** Una cuenta o categoría con movimientos no se elimina (`409`). La moneda de una cuenta con movimientos no cambia.

### Trazabilidad SDD

Mostrar la cadena completa para una historia, por ejemplo HU-08 (registrar un ingreso o gasto):

1. [docs/historias-de-usuario.md](historias-de-usuario.md): la historia con sus 4 escenarios Gherkin.
2. [openspec/specs/gestion-movimientos/spec.md](../openspec/specs/gestion-movimientos/spec.md): el requisito con `Origen: HU-08` y los escenarios como contrato.
3. [docs/trazabilidad.md](trazabilidad.md): historia → spec → cambio `implementar-movimientos` → rama `feature/implementar-movimientos` → versión `v0.6.0`.
4. `openspec/changes/archive/…-implementar-movimientos/`: propuesta, diseño con las decisiones y tareas marcadas.
5. [docs/cobertura-escenarios.md](cobertura-escenarios.md): cada escenario enlazado a su prueba.
6. CI: `npm run cobertura:comprobar` falla si un escenario se queda sin prueba (RT-09).

Puntos clave: 33 historias × 4 escenarios = **132 escenarios, todos con prueba automática**; 13 cambios de OpenSpec archivados; una versión etiquetada por épica (`v0.1.0` … `v1.0.0`).

## 3. Seguridad, RBAC y aislamiento multiinquilino (peso 4)

**Objetivo (nivel 3):**
- JWT y contraseñas cifradas.
- Permisos por rol en rutas **y** servicios.
- Demostrar **en vivo**, con consultas filtradas en el repositorio, que cada usuario solo accede a sus datos.

Demostración:

1. **Aislamiento en vivo.**
   - En la ventana de Ana, copiar desde *Network* el `id` (UUID) de uno de sus movimientos.
   - En la ventana de Luis, ejecutar en la consola:

     ```js
     fetch('/api/v1/movimientos/<uuid-de-ana>').then((r) => r.status) // 404
     ```

   - La respuesta es `404`, idéntica a la de un recurso inexistente: no revela que existe.
2. **En la base.** En Compass, filtrar `movimientos` por `tenantId` y mostrar que cada documento lleva `tenantId` y `usuarioId`. Explicar `_filtro()` del repositorio base y el plugin que rechaza consultas sin `tenantId`.
3. **RBAC.**
   - Ana (usuario estándar) no ve "Administración".
   - Desde su consola, `fetch('/api/v1/admin/usuarios').then((r) => r.status)` devuelve `403`.
   - El administrador sí accede y ve los datos de Ana **en solo lectura**: usa `RepositorioLectura`, que no tiene métodos de escritura.
   - El rol se valida en el middleware `requerirRol` **y otra vez** en [autorizacion.service.js](../server/src/services/autorizacion.service.js), defensa en profundidad.
4. **Cambio de rol inmediato.** Degradar a un administrador mientras tiene la sesión abierta: su siguiente solicitud ya recibe `403`, porque el rol se lee de la base en cada petición. El último administrador no se puede degradar (`409`).
5. **JWT y contraseñas.**
   - Token de acceso JWT de 15 minutos en una cookie `httpOnly` (JavaScript no lo puede leer, lo que protege contra XSS).
   - Token de renovación opaco y rotativo, del que solo se guarda el hash.
   - Contraseñas con bcrypt.
   - Ver [utils/tokens.js](../server/src/utils/tokens.js) y [auth.service.js](../server/src/services/auth.service.js).

## 4. Dashboard, filtros y reportes (peso 3)

**Objetivo (nivel 3):** KPI y gráficos calculados con exactitud, filtros combinados en tiempo real y exportación a PDF y Excel sin errores.

1. **Dashboard de Ana.**
   - Ingresos, gastos, balance y porcentaje del presupuesto usado.
   - Gráfico de evolución de 6 meses y dona de distribución por categoría (Chart.js), cada uno con su tabla equivalente.
   - Cambiar el mes y la moneda (PEN → USD): los indicadores se recalculan.
2. **Exactitud.** Registrar un gasto y volver al dashboard: los gastos y el balance cambian exactamente en ese monto.
3. **Filtros combinados** en *Movimientos*: rango de fechas + tipo + categoría + cuenta. Un rango con la fecha inicial mayor que la final se avisa y no se aplica.
4. **Exportar** con los filtros aplicados:
   - **PDF** (jsPDF): período, totales por moneda y tabla.
   - **Excel** (SheetJS): hojas "Movimientos" y "Resumen".
   - Ambos se generan en el servidor y respetan los mismos filtros.
   - Sin datos, el servidor responde `400` "No hay datos disponibles para exportar".

## 5. Calidad de código y buenas prácticas (peso 2)

**Objetivo (nivel 3):**
- Capas estrictas.
- Clean Code y DRY.
- UUID públicos, Day.js e interfaz responsiva.

| Práctica | Evidencia |
|---|---|
| Capas sin mezclar | Los controladores no importan modelos ni repositorios; los servicios no ven `req`/`res`. En el cliente, ESLint impide que un dominio importe el interior de otro ([eslint.config.js](../eslint.config.js)). |
| SOLID | Responsabilidad única por capa; inyección de dependencias en `app.js` (abierto a extensión y fácil de probar); repositorio de solo lectura separado del de escritura (segregación de interfaces). |
| DRY | Validaciones y mensajes compartidos entre cliente y servidor en `shared/`; repositorio base para todos los recursos; un solo filtro de movimientos para el historial y los reportes. |
| UUID públicos (RT-08) | Todo recurso se identifica con un UUID v4 generado por el servidor ([identificador.js](../server/src/models/plugins/identificador.js)); prueba en [identificadores.test.js](../server/tests/identificadores.test.js). |
| Day.js | Fechas y períodos en la zona horaria de la aplicación ([utils/fechas.js](../server/src/utils/fechas.js), [formato.js](../client/src/shared/utils/formato.js)). |
| Responsivo | Abrir *DevTools → modo dispositivo*: en móvil la navegación pasa a una barra inferior y los formularios a paneles a pantalla completa. |
| Verificación continua | CI en cada pull request (lint, pruebas, cobertura de escenarios y compilación) y quality gate de SonarCloud. |

## Preguntas probables

| Pregunta | Respuesta corta |
|---|---|
| ¿Por qué MongoDB y no SQLite, como dice el enunciado? | El mismo enunciado pide el stack MERN con MongoDB Atlas para la entrega; el equipo lo decidió al inicio y quedó registrado en el diseño técnico. |
| ¿Por qué necesitan replica set? | Las transacciones de MongoDB solo funcionan en un replica set. Guardar un movimiento y ajustar el saldo deben ser atómicos. Atlas ya es replica set; en local se configura uno de un nodo. |
| ¿Cómo garantizan que un usuario no vea datos de otro? | El `tenantId` sale del token, nunca del cuerpo. El repositorio base lo agrega a toda consulta, el plugin rechaza consultas sin él y un recurso ajeno responde 404. Hay pruebas para cada recurso. |
| ¿Qué pasa si alguien manipula la interfaz para ver "Administración"? | Nada: la API exige el rol en el middleware y en el servicio, y lo lee de la base en cada solicitud. |
| ¿Por qué `jsonwebtoken` y no express-jwt o passport-jwt? | El JWT va en una cookie `httpOnly` y hay que revalidar el rol y la sesión contra la base en cada petición. Un middleware propio de pocas líneas hace exactamente eso sin otra dependencia. |
| ¿Por qué UUID y no el ObjectId de MongoDB? | El UUID no revela el orden ni el momento de creación, lo genera el servidor y no depende de la base. |
| ¿Cómo evitan errores de redondeo? | Montos como texto en la API, `Decimal128` en la base y `decimal.js` en los cálculos. |
| ¿Cómo saben que se cumplen todas las historias? | Cada uno de los 132 escenarios está enlazado a una prueba automática y CI falla si uno queda sin prueba (RT-09). |
| ¿Qué hizo la IA y qué entienden ustedes? | La IA asistió en la implementación a partir de las specs. Cada decisión está en un `design.md` revisado por el equipo y cada escenario se verifica con pruebas. Conviene ensayar los recorridos de esta guía para poder explicarlos sin leer. |

## Autoevaluación con la rúbrica

| Criterio | Peso | Nivel esperado | Evidencia principal |
|---|---|---|---|
| Demostración funcional MERN | 6 | 3 | CRUD completo en vivo sobre Atlas, validación en cliente y servidor, códigos HTTP y notificaciones |
| Arquitectura y dominio | 6 | 3 | Recorrido Controller → Service → Repository, reglas de saldo y presupuesto, trazabilidad SDD con 132 escenarios |
| Seguridad y multiinquilino | 4 | 3 | 404 en vivo entre inquilinos, 403 por rol, RBAC en middleware y servicio, JWT `httpOnly` y bcrypt |
| Dashboard y reportes | 3 | 3 | KPI exactos, gráficos con tabla, filtros combinados, PDF y Excel desde el servidor |
| Calidad de código | 2 | 3 | Capas estrictas, `shared/` (DRY), UUID v4, Day.js, responsivo, CI y SonarCloud |

Con nivel 3 en todos: Σ(peso × nivel) = 63, es decir 63 / 63 × 20 = **20**.
