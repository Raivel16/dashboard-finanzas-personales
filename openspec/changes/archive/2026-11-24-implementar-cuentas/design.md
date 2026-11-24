# Design

## Context

Los requisitos están en `openspec/specs/gestion-cuentas/spec.md`; el motivo y el alcance, en `proposal.md`. El diseño base (`openspec/changes/archive/2026-11-21-definir-arquitectura-base/design.md`) fija la colección `cuentas` (`tenantId`, `usuarioId`, `nombre`, `tipo`, `moneda`, `saldoInicial`, `saldoActual`; único `(tenantId, nombre)`), el nombre de 2 a 50 caracteres, que los importes son `Decimal128` en la base y `decimal.js` en el código, y que cada movimiento copiará la moneda de su cuenta.

Estado del código del que se parte (se repite el patrón de `implementar-categorias`):

- `shared/` ya tiene `esquemaCuenta` (nombre, tipo, moneda, saldo inicial con `esDecimal` y `normalizarMonto`), `TIPOS_CUENTA` y `MONEDAS`. Sus mensajes de nombre y moneda obligatorios no son los de la spec.
- `RepositorioBase` (con `collation` en `listar`), el plugin de tenant, `admin.repositorioLecturaDe` y el patrón del servicio de categorías (conflicto por clave duplicada, transacción de eliminación con el conteo de movimientos) ya existen. `decimal.js` ya es dependencia del servidor.
- El cliente tiene `Monto` y `formato.js` (`formatearMonto` con símbolo de moneda), `PanelRegistro`, `useFormulario` y el dominio `categorias/` como modelo.

## Goals / Non-Goals

**Goals:**

- Que cada escenario de HU-07 y HU-25 tenga una prueba automatizada que pase, y que los de HU-04, HU-05 y HU-22 queden probados sobre cuentas reales.
- Que ningún importe pase por `Number`: se valida como texto, se guarda como `Decimal128` y se suma con `decimal.js`.
- Que corregir el saldo inicial mantenga la coherencia (`saldoActual` cambia en la misma diferencia) aunque haya dos correcciones simultáneas.
- Que la épica de movimientos solo tenga que insertar documentos: las reglas de eliminación y de moneda ya funcionan contra la colección `movimientos`.

**Non-Goals:**

- Crear, editar o eliminar movimientos y recalcular saldos al hacerlo (HU-26, épica 5); totales entre cuentas o conversión de moneda; cuentas compartidas; cerrar o archivar cuentas.

## Decisions

### 1. Modelo, importes y unicidad

`cuenta.model.js` guarda `tenantId`, `usuarioId`, `nombre`, `tipo`, `moneda`, `saldoInicial` y `saldoActual` (ambos `Decimal128`), con el plugin de tenant. El índice único `{ tenantId, nombre }` lleva la intercalación `{ locale: 'es', strength: 1 }` ("Visa" y "visa" chocan). Como en categorías, el servicio no consulta antes de insertar: traduce el error de clave duplicada a `ConflictError` ("Ya existe una cuenta con ese nombre"). Al crear, `saldoActual` es igual a `saldoInicial`. La vista devuelve los dos saldos como texto con dos decimales (`"200.00"`, `"-15.50"`) y nunca como número.

### 2. Rutas bajo `/api/v1/cuentas`

`GET /cuentas` (paginado como fija `contrato-api`; filtros opcionales `tipo` y `moneda`; orden por nombre; el cliente pide `limit=100`), `POST /cuentas` (`nombre`, `tipo`, `moneda`, `saldoInicial` opcional con 0.00 por defecto), `GET /cuentas/:id`, `PATCH /cuentas/:id` y `DELETE /cuentas/:id`. El `tenantId` y el `usuarioId` salen siempre de la sesión. Una cuenta de otra persona o un identificador inválido responde 404 con el mensaje estándar. El saldo inicial puede ser negativo (p. ej. una tarjeta de crédito con deuda) y tiene el mismo tope que un monto.

### 3. Edición: nombre, tipo, moneda y saldo inicial

`PATCH` acepta cualquiera de los cuatro campos. Cambiar el **nombre** o el **tipo** no toca los movimientos. Cambiar la **moneda** de una cuenta con movimientos se rechaza con 409 "No se puede cambiar la moneda de una cuenta con movimientos asociados"; si no tiene movimientos, se acepta y el saldo se conserva tal cual (no hay conversión). Enviar la misma moneda que ya tiene no es un cambio y siempre se acepta.

### 4. Corrección del saldo inicial

Dentro de una transacción se lee la cuenta, se calcula `diferencia = nuevoSaldoInicial − saldoInicialActual` con `decimal.js` y se guardan `saldoInicial` y `saldoActual + diferencia`. Los movimientos no se tocan: con saldo inicial 100.00 y saldo actual 70.00, corregir a 120.00 deja el actual en 90.00. La transacción serializa dos correcciones simultáneas (la segunda se reintenta sobre el valor ya cambiado), así que el saldo actual nunca queda a mitad de camino. Esta regla es consistente con la fórmula del diseño base (`saldoActual = saldoInicial + Σ ingresos − Σ gastos`).

### 5. Eliminación bloqueada por movimientos

Igual que en categorías: la transacción cuenta los movimientos de esa cuenta y de ese inquilino (colección `movimientos`, campo `cuentaId`) y, si hay alguno, responde 409 "No se puede eliminar una cuenta con movimientos asociados"; si no, elimina. El puerto de conteo vive en `cuenta.repository.js`; `implementar-movimientos` lo reemplaza por su repositorio. La cuenta que se mueve a una cuenta de otra persona nunca cuenta: el filtro incluye el `tenantId`.

### 6. Mensajes de la spec en el esquema compartido

`esquemaCuenta` pasa a devolver "El nombre de la cuenta es obligatorio" cuando el nombre está vacío y "La moneda es obligatoria" cuando no hay moneda (un valor no soportado sigue diciendo "Selecciona una moneda válida"). Como cliente y servidor usan el mismo esquema, el bloqueo del formulario y la respuesta de la API dicen lo mismo. `esquemaActualizarCuenta` repite las reglas con todos los campos opcionales y exige al menos uno.

### 7. Lectura de administrador

`GET /admin/usuarios/:id/cuentas` (solo `GET`, bajo `requerirRol('admin')`) usa `admin.repositorioLecturaDe(actor, Cuenta, id)`. Igual que en categorías, no se agrega ninguna ruta de escritura de administrador y modificar una cuenta ajena da 404. Se prueban sobre cuentas reales HU-04 (el administrador consulta las cuentas de cualquier usuario), HU-05 (un usuario no ve ni toca las de otro) y HU-22 (consulta, estado vacío y modificación ajena rechazada).

### 8. Cliente: dominio `cuentas/`

`cuentas/` tiene servicio, hooks (`useCuentas` con carga, panel de crear o editar y eliminación con `confirmar`; `useFormularioCuenta` con las reglas de `shared/`; `useCuentasDeUsuario`), componentes de presentación (`ListaCuentas`, `FormularioCuenta`, `ListaCuentasSoloLectura`) y la página `/cuentas`. Cada cuenta muestra su nombre, su tipo, su moneda y su saldo con el símbolo de la moneda ("$ 200.00"); no se suman saldos de monedas distintas ni se muestra un total. El selector de moneda empieza sin selección ("Selecciona una moneda") para que el escenario "Moneda no seleccionada" bloquee el envío con "La moneda es obligatoria". Los errores 409 del servidor (nombre repetido, moneda con movimientos) se muestran junto al campo, y el de eliminación como aviso con el mensaje exacto. `cuentas/index.js` exporta también `ListaCuentasSoloLectura` y `useCuentasDeUsuario`, que `administracion/` usa en el detalle de usuario respetando la frontera entre dominios. La pantalla sigue `DESIGN.md` y `PRODUCT.md`.

## Risks / Trade-offs

- [Las reglas con movimientos se prueban con documentos insertados a mano, no con el flujo real] → El puerto lee la misma colección y campos que usará `implementar-movimientos`, que debe agregar su propia prueba de extremo a extremo y retirar el puerto.
- [El saldo actual solo cambia aquí al corregir el saldo inicial; los movimientos lo ajustarán en la épica 5] → La fórmula del diseño base garantiza que ambos caminos suman lo mismo; `implementar-movimientos` agrega el recálculo y el script `verificar-saldos`.
- [Cambiar la moneda de una cuenta sin movimientos conserva el número del saldo] → Es el comportamiento esperado (no hay conversión) y la pantalla lo avisa antes de guardar.
- [Las cuentas con movimientos que se eliminen en la épica 5 desde otro flujo] → `implementar-movimientos` debe validar que la cuenta exista dentro de la transacción que crea un movimiento; queda anotado en `docs/trazabilidad.md`.
