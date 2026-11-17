# Proposal

## Why

Las historias de usuario y las specs dejaron supuestos abiertos (alcance del administrador, categorías globales, tiempos de sesión, umbral de alerta, inclusión de HU-09) y no existía ninguna decisión técnica. El equipo ya confirmó los supuestos y eligió el stack MERN; antes de escribir código hay que fijar esas decisiones en las specs y definir la arquitectura base común sobre la que se implementará cada historia, para que todas las funcionalidades se construyan con las mismas reglas (aislamiento de datos, contrato de la API, seguridad, manejo de montos).

## What Changes

- Se confirman los supuestos de `docs/historias-de-usuario.md`: HU-09 entra al alcance, la sesión expira tras 30 minutos de inactividad, el enlace de recuperación dura 30 minutos y el umbral de alerta del presupuesto es 90 %.
- **BREAKING (requisitos)**: el administrador solo **visualiza** los datos de todos los usuarios; no crea, edita ni elimina datos financieros ajenos. Se elimina la noción de "categoría global del sistema": todas las categorías pertenecen a un usuario. Como funciones exclusivas del administrador quedan la consulta de solo lectura y la gestión de roles de usuarios.
- Al registrarse, cada usuario recibe un conjunto de categorías predeterminadas propias y editables (reemplaza a las categorías globales).
- **Soporte multimoneda**: cada cuenta tiene una moneda; los movimientos heredan la moneda de su cuenta; indicadores, gráficos, presupuestos y reportes se calculan por moneda, sin conversión automática entre monedas.
- El saldo de cada cuenta se actualiza con cada movimiento y debe coincidir siempre con el saldo inicial más los ingresos menos los gastos registrados.
- La sesión usa un token de acceso de corta duración y un token de renovación, ambos en cookies `httpOnly`, con cierre de sesión explícito.
- Los reportes PDF y Excel se generan en el servidor (jsPDF y SheetJS) y se descargan desde la API.
- Se define el contrato común de la API REST: versionado `/api/v1`, formato estándar de respuestas y errores, paginación y filtros.
- Se define la arquitectura base del proyecto (monorepo `client/`, `server/`, `shared/` con npm workspaces, JavaScript, backend con arquitectura MVC cuya capa Modelo se divide en modelos, servicios y repositorios, frontend con Screaming Architecture (dominios con componentes, hooks y servicios, router central y lógica de negocio separada del diseño), aislamiento por `tenantId` en el repositorio, tooling de lint, formato y pruebas, configuración por `.env`, MongoDB local preparado para Atlas, protección de ramas en GitHub).

## Capabilities

### New Capabilities
- `contrato-api`: convenciones observables de la API REST compartidas por todos los módulos (versionado, formato de respuestas y errores, códigos HTTP, paginación, ordenamiento y filtros).

### Modified Capabilities
- `autenticacion-usuarios`: duración de la sesión por inactividad (30 min), renovación de sesión, cierre de sesión y categorías iniciales al registrarse; acceso ampliado del administrador sin edición de datos ajenos.
- `control-acceso`: el administrador solo visualiza datos de otros usuarios y gestiona roles; se elimina la operación sobre "categorías globales".
- `gestion-categorias`: categorías predeterminadas propias por usuario creadas al registrarse.
- `gestion-cuentas`: moneda por cuenta y consistencia del saldo con los movimientos.
- `gestion-movimientos`: el movimiento hereda la moneda de su cuenta y la categoría debe coincidir con el tipo del movimiento.
- `consulta-movimientos`: filtro por moneda y paginación según el contrato de la API.
- `dashboard-indicadores`: indicadores y gráficos calculados por moneda seleccionada.
- `presupuestos`: presupuesto mensual por moneda.
- `reportes-exportacion`: generación en el servidor, columna de moneda y totales agrupados por moneda.

## Impact

- **Documentación**: `docs/historias-de-usuario.md` (supuestos confirmados y ajustes a HU-02/HU-04), specs principales al archivar este cambio, `CLAUDE.md` y `openspec/config.yaml`.
- **Código (nuevo)**: estructura `client/` (React + Vite), `server/` (Express) y `shared/` (esquemas de validación y constantes), configuración raíz de npm workspaces, ESLint, Prettier, Jest/Supertest y Vitest.
- **Dependencias**: Express, Mongoose, Validator.js, express-jwt, bcrypt, cookie-parser, helmet, cors, Nodemailer, jsPDF, SheetJS, uuid, Day.js, decimal.js, pino; React, React Router, Tailwind CSS, Chart.js + react-chartjs-2, SweetAlert2, react-toastify.
- **Infraestructura**: MongoDB local como replica set de un nodo (necesario para transacciones, igual que Atlas), proveedor SMTP con capa gratuita, reglas de protección de ramas `main` y `dev` en GitHub.
