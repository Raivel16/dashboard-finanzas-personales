# Dashboard de Finanzas Personales

Proyecto universitario (UC) con stack **MERN**: MongoDB, Express, React y Node.js. Permite registrar cuentas, categorías, movimientos y presupuestos, y ver indicadores y reportes de las finanzas personales.

El desarrollo es guiado por especificaciones (OpenSpec): las historias de usuario están en [docs/historias-de-usuario.md](docs/historias-de-usuario.md), la trazabilidad en [docs/trazabilidad.md](docs/trazabilidad.md) y el diseño técnico en [openspec/changes/archive/2026-11-21-definir-arquitectura-base/design.md](openspec/changes/archive/2026-11-21-definir-arquitectura-base/design.md). La interfaz sigue [DESIGN.md](DESIGN.md) y [PRODUCT.md](PRODUCT.md).

## Requisitos

- **Node.js 22** (el archivo `.nvmrc` lo fija; con `fnm` o `nvm` basta `fnm use` / `nvm use`).
- **MongoDB como replica set** (local o Atlas). Las transacciones que mantienen los saldos consistentes lo exigen: sin replica set el servidor no arranca.
- Git.

## Instalación

```sh
git clone https://github.com/Raivel16/dashboard-finanzas-personales.git
cd dashboard-finanzas-personales
npm install
cp server/.env.example server/.env   # y completa JWT_ACCESS_SECRET (ver el archivo)
npm run seed -w server               # opcional: datos de demostración
npm run dev                          # servidor en :3000 y cliente en :5173
```

Abre <http://localhost:5173>: la página de inicio muestra si la API y la base de datos están disponibles.

El repositorio es un monorepo con npm workspaces: `client/` (React), `server/` (Express) y `shared/` (validaciones, constantes y mensajes en español usados por ambos).

## MongoDB local como replica set

MongoDB instalado localmente arranca como servidor único; hay que convertirlo en un replica set de un nodo **una sola vez**.

1. Edita el archivo de configuración y agrega:

   ```yaml
   replication:
     replSetName: rs0
   ```

   - Windows: `C:\Program Files\MongoDB\Server\<versión>\bin\mongod.cfg` (se edita como administrador).
   - Linux: `/etc/mongod.conf`. macOS (Homebrew): `/opt/homebrew/etc/mongod.conf`.

2. Reinicia el servicio (en Windows, `Restart-Service MongoDB` como administrador; en Linux, `sudo systemctl restart mongod`).
3. Inicia el replica set:

   ```sh
   mongosh --eval "rs.initiate({ _id: 'rs0', members: [{ _id: 0, host: '127.0.0.1:27017' }] })"
   ```

4. Usa en `server/.env`: `MONGODB_URI=mongodb://127.0.0.1:27017/finanzas?directConnection=true`.

Si el servidor no arranca y dice que falta el replica set, repite los pasos anteriores.

### Cambiar a MongoDB Atlas

No requiere cambios de código: reemplaza solo `MONGODB_URI` en `server/.env` por la URI `mongodb+srv://...` de tu clúster (Atlas ya es un replica set) y permite tu IP en _Network Access_.

## Comandos

Desde la raíz del repositorio:

| Comando                        | Qué hace                                                         |
| ------------------------------ | ---------------------------------------------------------------- |
| `npm run dev`                  | Servidor (:3000) y cliente (:5173) juntos; Vite reenvía `/api`   |
| `npm test`                     | Pruebas de `shared`, `server` y `client`                         |
| `npm run lint`                 | ESLint, incluidas las fronteras entre dominios del cliente       |
| `npm run build`                | Compila el cliente en `client/dist`                              |
| `npm run format`               | Formatea con Prettier (`format:check` solo comprueba)            |
| `npm run seed -w server`       | Carga datos de demostración (reemplaza solo los usuarios demo)   |
| `npm run seed:admin -w server` | Crea el primer administrador desde `ADMIN_EMAIL` y `ADMIN_PASSWORD` |

Una sola prueba o un solo paquete:

```sh
npm test -w shared
npm test -w client -- tests/rt05.test.jsx
npm test -w server -- seed            # Jest filtra por nombre de archivo
npm test -w server -- -t "primer administrador"   # o por nombre de prueba
```

Las pruebas del servidor usan MongoDB en memoria (replica set), sin `.env` ni servicios externos. La primera vez `mongodb-memory-server` descarga el binario de `mongod`. Si prefieres usar el instalado en tu máquina:

```sh
# Windows (PowerShell)
$env:MONGOMS_SYSTEM_BINARY = "C:\Program Files\MongoDB\Server\9.0\bin\mongod.exe"
# Linux / macOS / Git Bash
export MONGOMS_SYSTEM_BINARY=/usr/bin/mongod
```

## Datos de demostración

`npm run seed -w server` crea, con datos sintéticos, un administrador y tres usuarios: `ana.torres` y `luis.quispe` (varias monedas y presupuestos normal, en alerta y excedido) y `sofia.nueva` (sin movimientos). Todos con el correo `<usuario>@demo.finanzas.test` y la contraseña `Demo1234` (o la de `SEED_PASSWORD`).

- Repetirlo reemplaza únicamente esos usuarios; los demás no cambian.
- Se niega a ejecutarse con `NODE_ENV=production` o sobre una base que no sea local, salvo `--permitir-remoto`.

`npm run seed:admin -w server` crea el primer administrador con `ADMIN_EMAIL` y `ADMIN_PASSWORD`. Si el correo ya es de un usuario estándar, falla en lugar de promoverlo; si el administrador ya existe, informa que no hay cambios.

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

## Flujo de ramas y commits

Git Flow con Conventional Commits en español (detalle en [CLAUDE.md](CLAUDE.md) y [docs/Los prefijos en las ramas.pdf](docs/Los%20prefijos%20en%20las%20ramas.pdf)).

- `main` solo recibe `dev` mediante pull request cuando se completa una épica; `dev` es la rama de integración. No se hace commit directo en ninguna de las dos.
- Cada tarea sale de un `dev` actualizado y vuelve a él con un pull request cuyo job `verificar` (lint, pruebas y compilación con Node 22) debe pasar:

  ```sh
  git switch dev && git pull && git switch -c feature/implementar-movimientos
  ```

- Prefijos: `feature/`, `fix/`, `hotfix/`, `refactor/`, `test/`, `docs/`, `chore/`, `ci/`, `release/`. Commits: `feat(hu-08): descripción en imperativo`.
- No hay código sin una historia de usuario (HU-xx) o un requisito técnico (RT-xx) en [docs/trazabilidad.md](docs/trazabilidad.md).
