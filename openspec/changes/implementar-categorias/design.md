# Design

## Context

Los requisitos están en `openspec/specs/gestion-categorias/spec.md`; el motivo y el alcance, en `proposal.md`. El diseño base (`openspec/changes/archive/2026-11-21-definir-arquitectura-base/design.md`) fija la colección `categorias` (`tenantId`, `usuarioId`, `nombre`, `tipo`, `icono`; único `(tenantId, tipo, nombre)` sin distinguir mayúsculas), el nombre de 2 a 50 caracteres y que no existen categorías globales.

Estado del código del que se parte:

- `shared/` ya tiene `esquemaCategoria` (nombre, tipo, ícono de hasta 40 caracteres), `CATEGORIAS_PREDETERMINADAS` y `LIMITES.NOMBRE_CUENTA_CATEGORIA`.
- `RepositorioBase` y el plugin de tenant (`tenant.plugin.js`) ya filtran por `tenantId` y descartan `_id`, `tenantId` y `usuarioId` en las actualizaciones; `RepositorioLectura` y `admin.repositorioLecturaDe` ya existen.
- `auth.service.registrar` crea solo el usuario y luego envía el correo de bienvenida; `usuario.repository` ya usa transacciones (cambio de rol), así que el replica set es un requisito cumplido.
- El seed trae su propia copia de las diez categorías. El cliente no tiene aún ningún dominio de datos; `administracion/` tiene el detalle de usuario con las secciones vacías.

## Goals / Non-Goals

**Goals:**

- Que cada escenario de HU-06 y HU-24 tenga una prueba automatizada que pase, y que los de HU-04, HU-05 y HU-22 queden probados sobre categorías reales.
- Que el nombre duplicado sea imposible aun con dos solicitudes simultáneas (lo decide la base de datos, no solo el servicio).
- Que el registro sea todo o nada: o existe el usuario con sus diez categorías, o no existe nada.
- Que la épica de movimientos solo tenga que insertar documentos: la regla de eliminación ya funciona contra la colección `movimientos`.

**Non-Goals:**

- Movimientos, cuentas y presupuestos (épicas 4, 5 y 8); reasignar movimientos a otra categoría; restaurar las predeterminadas; categorías anidadas o con color.
- Rellenar categorías en cuentas ya creadas: solo hay datos de desarrollo y HU-24 habla de "usuario nuevo".

## Decisions

### 1. Modelo y unicidad sin distinguir mayúsculas

`categoria.model.js` guarda `tenantId`, `usuarioId`, `nombre` (recortado), `tipo` (`ingreso`/`gasto`) e `icono`, con `timestamps` y el plugin de tenant. El índice único `{ tenantId, tipo, nombre }` se declara con intercalación `{ locale: 'es', strength: 2 }`, que ignora mayúsculas y tildes ("Educación" y "educacion" chocan). El servicio no consulta antes de insertar: intenta crear y traduce el error de clave duplicada (código 11000) a `ConflictError` con "Ya existe una categoría con ese nombre", igual que ya hace el registro con el correo. Así dos creaciones simultáneas no pueden ganar ambas.

### 2. Rutas bajo `/api/v1/categorias`

`GET /categorias` (paginado como fija `contrato-api`; filtro opcional `tipo`; orden por tipo y nombre; el cliente pide `limit=100`), `POST /categorias` (`nombre`, `tipo`, `icono`), `PATCH /categorias/:id` y `DELETE /categorias/:id`. Todas exigen sesión; el `tenantId` y el `usuarioId` salen siempre de `req.usuario`, nunca del cuerpo. Una categoría de otra persona o con identificador inválido responde 404 con el mensaje estándar, sin revelar que existe. La vista devuelve `id`, `nombre`, `tipo`, `icono` y las fechas.

### 3. El tipo no se puede cambiar al editar

`PATCH` acepta `nombre` e `icono`, no `tipo`. Un movimiento de gasto no puede quedar apuntando a una categoría de ingreso (regla de coherencia de HU-27), y el escenario de edición solo habla del nombre. Si alguien quiere otro tipo, crea una categoría nueva. Se asume así y queda escrito aquí; el servicio rechaza el campo con `VALIDATION_ERROR`.

### 4. Renombrar se refleja en el historial sin tocar movimientos

Los movimientos guardan `categoriaId`, no el nombre, así que renombrar actualiza un solo documento y el historial muestra el nombre nuevo cuando se lee. No se copia el nombre en ningún otro documento.

### 5. Eliminación bloqueada por movimientos

El servicio cuenta los movimientos de esa categoría y de ese inquilino antes de borrar; si hay alguno responde 409 con "No se puede eliminar una categoría con movimientos asociados. Reasigna o elimina los movimientos primero". La cuenta y el borrado van dentro de una transacción para no borrar una categoría usada entre la cuenta y el borrado. Mientras no exista el modelo de movimientos, la cuenta se hace con un pequeño puerto (`contarMovimientosDeCategoria`) que lee la colección `movimientos` (`{ tenantId, categoriaId }`); `implementar-movimientos` lo reemplaza por su repositorio y la regla no cambia. Las pruebas insertan documentos de movimiento en esa colección. Quedan fuera los presupuestos por categoría: `implementar-presupuestos` decidirá qué pasa al borrar una categoría con presupuesto.

### 6. Registro todo o nada (HU-24)

`registrar` abre una transacción y dentro crea el usuario y, con una sola inserción, las diez categorías de `CATEGORIAS_PREDETERMINADAS` con su `tenantId` y `usuarioId`. Si cualquier paso falla, no queda nada: el visitante recibe un 500 con el mensaje "No pudimos completar tu registro. Inténtalo nuevamente" y puede repetir con el mismo correo. El correo duplicado sigue respondiendo 409 (la clave duplicada del usuario aborta la transacción). El correo de bienvenida se envía después de confirmar, y un fallo de correo sigue sin deshacer el registro. Las categorías se crean solo al registrarse: iniciar sesión nunca las repone, así que una predeterminada eliminada no reaparece.

### 7. Lectura de administrador

`GET /admin/usuarios/:id/categorias` (solo `GET`, bajo `requerirRol('admin')`) usa `admin.repositorioLecturaDe(actor, Categoria, id)` y devuelve la misma vista paginada. No se agrega ninguna ruta de escritura de administrador: intentar `PATCH` o `DELETE` sobre `/categorias/:id` de otra persona da 404 porque esas rutas filtran por el inquilino del solicitante. Se prueban así, sobre categorías reales, HU-04 (el administrador consulta categorías de cualquier usuario), HU-05 (un usuario no ve ni toca las de otro, ni siquiera conociendo el `id`) y HU-22 (consulta, estado vacío y modificación ajena rechazada).

### 8. Cliente: dominio `categorias/` y una lista reutilizable

`categorias/` tiene servicio, hooks (`useCategorias` con carga, creación, edición y eliminación; `useFormularioCategoria` con las reglas de `shared/`), componentes de presentación (`ListaCategorias`, `FormularioCategoria`, `SelectorIcono`) y la página `/categorias`, con gastos e ingresos en dos grupos. Eliminar pide confirmación con `confirmar` (SweetAlert2); el 409 se muestra con el mensaje del servidor y la categoría se conserva. Los íconos salen de una lista cerrada compartida (`ICONOS_CATEGORIA` en `shared/`, que el servidor valida) mapeada a íconos de `lucide-react` en el cliente; un nombre de ícono desconocido muestra un ícono genérico en vez de romper la pantalla. `categorias/index.js` exporta también `ListaCategoriasSoloLectura`, que `administracion/` usa en el detalle de usuario: así se respeta la frontera entre dominios (solo se importa por el `index.js`) y la vista de administrador no tiene botones de editar ni eliminar. La pantalla sigue `DESIGN.md` y `PRODUCT.md`.

## Risks / Trade-offs

- [El escenario de movimientos asociados se prueba con documentos insertados a mano, no con el flujo real] → El puerto lee la misma colección y campos que usará `implementar-movimientos`, que debe agregar su propia prueba de extremo a extremo y retirar el puerto.
- [Crear un movimiento mientras se borra su categoría] → La transacción de borrado cubre la cuenta y la eliminación; `implementar-movimientos` debe validar la existencia de la categoría dentro de su propia transacción (queda anotado en `docs/trazabilidad.md`).
- [Las cuentas anteriores a este cambio no tienen categorías] → Solo existen datos de desarrollo; con el seed o un registro nuevo se obtienen las diez categorías, y se anota en el README.
- [El índice con intercalación exige que las consultas por nombre usen la misma intercalación para aprovecharlo] → Ninguna consulta busca por nombre: la unicidad la impone la inserción y el listado ordena por tipo y nombre.
