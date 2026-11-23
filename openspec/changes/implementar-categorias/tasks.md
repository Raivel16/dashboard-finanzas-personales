# Tasks

> Alcance: implementa HU-06 y HU-24 completas y las obligaciones de acceso de administrador de HU-04, HU-05 y HU-22 sobre categorías (ver `proposal.md`) en la rama `feature/implementar-categorias`. No cambia requisitos. Cada grupo incluye sus propias pruebas.

## 1. Preparación [RT-01]

- [x] 1.1 Crear la rama `feature/implementar-categorias` desde un `dev` actualizado y verificar con `git branch --show-current`
- [x] 1.2 Agregar a `shared/` la lista cerrada `ICONOS_CATEGORIA`, la validación del ícono en `esquemaCategoria` y los mensajes de categoría ("Ya existe una categoría con ese nombre", "No se puede eliminar una categoría con movimientos asociados. Reasigna o elimina los movimientos primero", "No pudimos completar tu registro. Inténtalo nuevamente"); verificar que todos los íconos de `CATEGORIAS_PREDETERMINADAS` están en la lista, con pruebas de `shared`

## 2. Servidor: categorías propias [HU-06]

- [x] 2.1 Crear `categoria.model.js` (con el plugin de tenant y el índice único `(tenantId, tipo, nombre)` con intercalación `es` de fuerza 1), `categoria.repository.js`, la vista y el servicio de creación y listado con `POST` y `GET /categorias` (paginado, filtro `tipo`); verificar "Creación exitosa de una categoría" (queda vinculada a su `tenantId` y `usuarioId`, aparece en el listado) y "Creación rechazada por nombre de categoría duplicado" (409 con el mensaje exacto, también con otras mayúsculas o tildes, y dos creaciones simultáneas dejan una sola)
- [x] 2.2 Implementar `PATCH /categorias/:id` (solo `nombre` e `icono`; rechaza `tipo`); verificar "Edición exitosa de una categoría existente" (el nombre nuevo se lee en los movimientos históricos asociados, que solo guardan `categoriaId`) y que renombrar a un nombre duplicado responde 409
- [x] 2.3 Implementar `DELETE /categorias/:id` con el puerto `contarMovimientosDeCategoria` (lee la colección `movimientos`) y transacción; verificar "Eliminación impedida por movimientos asociados" (409 con el mensaje exacto y la categoría se conserva) y la eliminación exitosa de una categoría sin movimientos
- [x] 2.4 Verificar el aislamiento: una categoría de otra persona, o un identificador inválido, responde 404 con "El recurso solicitado no existe o no tienes permiso para acceder a él" en lectura, edición y eliminación, y el cuerpo nunca puede fijar `tenantId` ni `usuarioId`

## 3. Servidor: categorías predeterminadas [HU-24]

- [x] 3.1 Hacer que `registrar` cree al usuario y sus diez categorías de `CATEGORIAS_PREDETERMINADAS` dentro de una transacción y envíe el correo de bienvenida solo después de confirmar; verificar "Categorías disponibles tras el registro" (siete de gasto y tres de ingreso, con los nombres de la spec y propias del usuario) y que el correo duplicado sigue dando 409 sin dejar categorías
- [x] 3.2 Verificar "Edición sin afectar a otros usuarios" (renombrar la de A no cambia la de B), "Categoría predeterminada eliminada" (tras eliminarla y volver a iniciar sesión no reaparece) y "Falla al crear las categorías iniciales" (con la creación de categorías fallando no queda el usuario, el visitante recibe el mensaje para intentarlo de nuevo y puede registrarse después con el mismo correo)

## 4. Servidor: lectura de administrador [HU-04, HU-05, HU-22]

- [x] 4.1 Agregar `GET /admin/usuarios/:id/categorias` con `admin.repositorioLecturaDe` (solo lectura, paginado); verificar HU-04 (el administrador consulta las categorías de cualquier usuario y un usuario estándar recibe 403), HU-22 (consulta, estado vacío para un usuario sin categorías, y `PATCH`/`DELETE` sobre una categoría ajena responde 404 sin cambiar nada) y HU-05 (un usuario no ve ni modifica las de otro conociendo su `id`)

## 5. Cliente [HU-06, HU-24, HU-22]

- [x] 5.1 Crear el dominio `categorias/` (servicio, `useCategorias`, `ListaCategorias`, página `/categorias`) y registrar la ruta y el destino "Categorías" en `router/`; verificar con pruebas "Categorías disponibles tras el registro" (gastos e ingresos agrupados) y el estado vacío con la acción de crear
- [x] 5.2 Agregar el formulario de crear y editar (`useFormularioCategoria` con las reglas de `shared/` y `SelectorIcono`); verificar con pruebas "Creación exitosa", "Edición exitosa", la validación del nombre y "Creación rechazada por nombre duplicado" con el mensaje del servidor
- [x] 5.3 Agregar la eliminación con confirmación (`confirmar`); verificar con pruebas la eliminación exitosa, "Eliminación impedida por movimientos asociados" (se muestra el mensaje exacto y la categoría se conserva) y que al cancelar no se llama a la API
- [x] 5.4 Exportar `ListaCategoriasSoloLectura` por `categorias/index.js` y mostrarla en el detalle de usuario de `administracion/` (con estado vacío "Este usuario aún no tiene categorías", sin botones de crear, editar ni eliminar); verificar con pruebas y que `npm run lint` no reporta fronteras rotas

## 6. Documentación e integración [RT-01, RT-06]

- [x] 6.1 Hacer que `scripts/seed.js` use `CATEGORIAS_PREDETERMINADAS` de `shared/` en lugar de su copia; verificar que las pruebas del seed siguen pasando
- [x] 6.2 Documentar en el README las rutas de categorías y la lectura de administrador y que las cuentas anteriores no reciben categorías; anotar en `docs/trazabilidad.md` que las categorías ya cumplen las obligaciones de administrador y que `implementar-movimientos` debe reemplazar el puerto de movimientos y validar la categoría dentro de su transacción; verificar que cada comando documentado se ejecuta
