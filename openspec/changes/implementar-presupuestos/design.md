# Design

## Context

Los requisitos están en `openspec/specs/presupuestos/spec.md`; el motivo y el alcance, en `proposal.md`. La decisión 20 del diseño base fija las reglas: un presupuesto por `(tenantId, periodo, moneda, categoriaId)` (nulo = general), categoría solo con general del mismo mes y moneda, suma de categorías sin superar el general, validadas en el servicio dentro de una transacción, y alertas calculadas comparando el porcentaje anterior y el nuevo al registrar o editar un gasto. `shared/` ya tiene `esquemaPresupuesto` (período `YYYY-MM`, moneda, categoría opcional, monto positivo).

## Goals / Non-Goals

**Goals:**

- Que cada escenario de HU-14, HU-15, HU-29 y HU-30 tenga una prueba automatizada que pase, en la API y en la pantalla.
- Que el gasto medido sea siempre el de la moneda y el mes del presupuesto, con `decimal.js` para porcentajes y restantes.

**Non-Goals:**

- Indicador en el dashboard (épica 7), copiar presupuestos entre meses, alertas por correo.

## Decisions

### 1. Modelo y rutas

Modelo `Presupuesto` con `tenantId`, `usuarioId`, `periodo`, `moneda`, `categoriaId` (nulo = general) y `monto` (`Decimal128`), con índice único `(tenantId, periodo, moneda, categoriaId)` (el nulo se guarda como `null` explícito para que el índice también cubra el general). Rutas con sesión obligatoria:

| Ruta | Función |
|---|---|
| `GET /presupuestos?periodo=&moneda=` | Lista los presupuestos (cualquier mes, también pasados). |
| `GET /presupuestos/seguimiento?periodo=&moneda=` | Para cada presupuesto del mes y la moneda: `gastado`, `restante`, `porcentaje`, `excedido`, `sobregiro`; y `sinAsignar` en el general. |
| `POST /presupuestos` | Crea; 409 si ya existe uno para esa clave. |
| `PUT /presupuestos/:id` | Reemplaza el monto (la confirmación la pide el cliente). |
| `DELETE /presupuestos/:id` | Elimina; un general con presupuestos por categoría responde 409. |

### 2. Reglas en el servicio, en transacción

`crear` y `reemplazar` corren en `enTransaccion`: validan el cuerpo con `esquemaPresupuesto`, rechazan meses anteriores al actual (`hoy(config.zonaHoraria, reloj.ahora())`) con "Solo puedes definir presupuestos para el mes actual o meses futuros", comprueban que la categoría sea propia y de gasto, exigen el general para las categorías y verifican que la suma de categorías no supere el general ("La suma por categorías supera el presupuesto general"). Al reemplazar el general se rechaza bajar de lo asignado ("El presupuesto general no puede ser menor a lo asignado por categorías"). Los montos se comparan con `decimal.js`.

### 3. Seguimiento

El gasto de cada presupuesto sale de una agregación de `movimientos` (`tipo: gasto`, la moneda y el mes del presupuesto; por `categoriaId` para los de categoría y total para el general, así un gasto sin presupuesto de categoría cuenta solo para el general). Porcentaje y restante se calculan con `decimal.js`. Sin gastos, 0 % y el monto completo disponible; con gastos por encima, `porcentaje` > 100 y `sobregiro` > 0.

### 4. Alertas al registrar o editar un gasto

`movimiento.service` calcula, dentro de la transacción del movimiento, el porcentaje de cada presupuesto afectado (general y el de la categoría) antes y después del cambio; si cruza 90 % o 100 % agrega a `meta.alertas` `{ presupuestoId, umbral, porcentaje, categoriaId }`. Así se avisa una sola vez por cruce sin guardar estado. El cliente muestra "Has utilizado el 90% de tu presupuesto mensual" (o el equivalente al excederlo, con el nombre de la categoría cuando es por categoría) con `notificar.atencion`. Eliminar un gasto no genera alertas.

### 5. Categorías con presupuesto

Eliminar una categoría con presupuestos se rechaza con 409 y "No puedes eliminar una categoría con presupuestos asignados", igual que con movimientos (comprobación y borrado en la misma transacción). Administración los lee con `GET /admin/usuarios/:id/presupuestos` mediante `repositorioLecturaDe`.

### 6. Cliente

Dominio `presupuestos/` (`components`, `hooks`, `services`, `pages`, `index.js`): `usePresupuestos` guarda el mes y la moneda elegidos, carga el seguimiento y maneja el panel de registro; `useFormularioPresupuesto` valida con `esquemaPresupuesto`; si ya existe presupuesto para esa clave pide confirmación con SweetAlert2 ("Ya existe un presupuesto para este mes, ¿deseas reemplazarlo?") y entonces llama a `PUT`. La barra de progreso muestra porcentaje y restante, cambia a rojo al excederse con el porcentaje y el monto sobregirado, y no depende solo del color. Sin presupuesto en el mes: "No has definido un presupuesto para este mes" con acceso directo para crearlo. Sigue `DESIGN.md` y `PRODUCT.md`.

## Risks / Trade-offs

- [El seguimiento agrega todos los gastos del mes en cada consulta] → El volumen personal lo permite; se apoya en los índices de `movimientos`.
- [Cambios de fecha o de moneda de una cuenta mueven gasto entre presupuestos] → La alerta compara antes y después en la misma transacción y el seguimiento siempre se recalcula desde los movimientos, nunca se guarda.
- [El tope solo limita la suma de presupuestos, no los gastos] → Los gastos que lo superan se ven como excedido; nunca se bloquean.
