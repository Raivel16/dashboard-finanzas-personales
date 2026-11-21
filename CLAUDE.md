# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

"Dashboard de Finanzas Personales" is a university project (UC). The requirements (user stories and OpenSpec specs) are complete and the **base project** (change `definir-arquitectura-base`, RT-01…RT-07) is implemented: npm-workspaces monorepo, Express server base, React client base with the visual system, seed script and CI. Feature work (HU-xx) follows the epic order in [docs/trazabilidad.md](docs/trazabilidad.md).

**Tech stack: MERN** — MongoDB (database), Express (REST API), React (frontend), Node.js (runtime). Use it for every proposal, design and implementation; don't introduce other backend frameworks, databases or frontend libraries that replace these.

## Commands

Run from the repo root (Node 22; MongoDB must be a replica set, see [README.md](README.md)). Server config lives in `server/.env` (template: `server/.env.example`).

```sh
npm install                       # installs all workspaces
npm run dev                       # server :3000 + client :5173 (Vite proxies /api)
npm run lint                      # ESLint, also enforces client domain boundaries
npm test                          # shared + server + client
npm run build                     # builds client/dist
npm run format                    # Prettier (format:check only verifies)
npm run seed -w server            # demo data (RT-06); refuses production / non-local DB
npm run seed:admin -w server      # first admin from ADMIN_EMAIL / ADMIN_PASSWORD (RT-07)

# One package / one file / one test
npm test -w shared
npm test -w client -- tests/rt05.test.jsx
npm test -w server -- seed                       # Jest: filter by file name
npm test -w server -- -t "primer administrador"  # Jest: filter by test name
```

Server tests use an in-memory MongoDB replica set (no `.env`, no external services). To use the locally installed `mongod` instead of downloading one, set `MONGOMS_SYSTEM_BINARY` to its path. In Git Bash use `builtin cd` if the `fnm` `cd` hook fails because of `.nvmrc`.

CI (`.github/workflows/ci.yml`, job `verificar`) runs `npm ci`, lint, test and build on Node 22 for pull requests to `dev` and `main`.

The specs also fix these technical points, which the implementation must respect:

- Express REST API with JWT authentication; roles `usuario estándar` and `administrador` (RBAC), with the role re-validated in the API (middleware/service layer), not just hidden in the React UI.
- Multi-tenant data isolation: every MongoDB document for movements, accounts, categories and budgets carries `tenantId` and `usuarioId`, and every query filters by the authenticated user's `tenantId` at the repository layer (another user's resource returns 404 without leaking data). Administrators get read-only access to other users' data.
- React frontend uses Chart.js for dashboard charts and SweetAlert2 for confirmation dialogs.
- Reports exportable to PDF and Excel, generated on the server.
- UI follows [DESIGN.md](DESIGN.md) (visual system, "La libreta de ahorros") and [PRODUCT.md](PRODUCT.md) (users, voice, principles). Read both before building any screen.
- `server/scripts/seed.js` provides the demo data (RT-06) and the first admin (RT-07); its tests are in `server/tests/seed.test.js`.

## Architecture (mandatory)

Full technical design, with rationale: [openspec/changes/definir-arquitectura-base/design.md](openspec/changes/definir-arquitectura-base/design.md) (moves to `openspec/changes/archive/` once archived). Monorepo with npm workspaces `client/`, `server/`, `shared/` (validation schemas built on Validator.js, constants and Spanish messages used by both sides). JavaScript with ES Modules, no TypeScript.

- **Backend — MVC, organized by layer** (`server/src/routes|controllers|views|models|services|repositories|middlewares`). The Model layer is split into Mongoose `models/`, `services/` (business rules and role authorization) and `repositories/` (the only code that touches models, always filtered by `tenantId`). Views build the JSON representation (and PDF/Excel files) of each resource. Controllers never touch models or repositories; services never see `req`/`res`.
- **Frontend — Screaming Architecture**: top-level folders in `client/src/` are business domains (`autenticacion/`, `movimientos/`, `dashboard/`…), each with `components/` (presentation only, data via props), `hooks/` (all business logic and state), `services/` (API calls), `pages/` (wire hooks to components) and an `index.js` public API. Routes live only in `client/src/router/`; cross-cutting code in `client/src/shared/`. A domain imports only from `shared/` or another domain's `index.js`; `shared/` never imports from a domain.

## Language

All project artifacts (specs, proposals, designs, tasks, docs, commit messages) are written in **Spanish**. In OpenSpec files, keep the structural headings (`## Purpose`, `## Requirements`, `### Requirement:`, `#### Scenario:`) and the keywords `SHALL`/`MUST`/`GIVEN`/`WHEN`/`THEN` in English (configured in [openspec/config.yaml](openspec/config.yaml)).

## Branches and commits

Follows [docs/Los prefijos en las ramas.pdf](docs/Los%20prefijos%20en%20las%20ramas.pdf) (Git Flow + Conventional Commits).

**Long-lived branches**

- `main` — only finished, working functionality. Never commit or develop directly on it. It receives `dev` through a pull request **when a whole epic is complete** (tagged per [docs/trazabilidad.md](docs/trazabilidad.md)), plus `hotfix/` merges.
- `dev` — integration branch. **Every work branch starts from `dev` and returns to it through a pull request** with CI passing. Never commit directly on it either. Implement one epic at a time.
- Exception: `hotfix/` branches start from `main` (critical production fix), and are merged into both `main` and `dev`.

Before starting any task, branch from an up-to-date `dev`: `git switch dev && git pull && git switch -c <prefijo>/<nombre>`.

**Branch prefixes**

| Prefix | Use |
|---|---|
| `feature/` | New functionality (e.g. a user story) |
| `fix/` | Bug in code still in development/testing |
| `hotfix/` | Critical fix applied to production (`main`) |
| `refactor/` | Restructure code without changing external behaviour |
| `test/` | Add/modify tests only |
| `docs/` | Documentation only (README, specs, user stories) |
| `chore/` | Maintenance: dependencies, tooling, editor/project config |
| `ci/` | CI/CD pipelines |
| `release/` | Prepare a version for `main` (e.g. `release/v1.0.0`) |

**Naming:** all lowercase, words separated by hyphens (no spaces or underscores), short Spanish description. Feature branches use the name assigned in [docs/trazabilidad.md](docs/trazabilidad.md) (`feature/implementar-movimientos`); fixes for one story include its ID (`fix/hu-02-bloqueo-intentos`).

**Commits:** Conventional Commits in Spanish, using the same types as the prefixes — `<tipo>: <descripción en imperativo>` (`feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `ci`), and a bullet body explaining the why. Code commits use the user story or technical requirement as scope (`feat(hu-08): ...`, `chore(rt-01): ...`). The commit type should match the branch prefix (`feature/` → `feat:`).

**Traceability:** no code without a user story (functional, HU-xx) or technical requirement (RT-xx). Never write technical items as user stories. Each one maps to one spec requirement and one OpenSpec change in [docs/trazabilidad.md](docs/trazabilidad.md); if work fits none, create or adjust the story or requirement first. A story or requirement is done when its 4 scenarios have passing automated tests, lint and CI are green, and its pull request is merged into `dev`. There is no minimum coverage percentage.

## Requirements sources

- [docs/historias-de-usuario.md](docs/historias-de-usuario.md) is the source of truth for requirements: 31 user stories (HU-01 … HU-31) grouped into 9 epics, each with exactly 4 Gherkin scenarios (camino feliz, flujo alternativo, manejo de errores, caso de borde). HU-01 … HU-17 are the team's original stories and must not be reworded; HU-18 … HU-31 fill functional gaps. Stories hold only user needs: development-only work (seed data, CI, project base, API conventions, first admin) is never a story; it lives as technical requirements RT-01 … RT-07 in the specs and [docs/trazabilidad.md](docs/trazabilidad.md). Confirmed decisions and field validation rules are in section 25 of the architecture design — check them before deciding those behaviours.
- `docs/HU_Dashboard_Finanzas_Personales_editado.docx` is the Word version of the same content. Whenever the Markdown changes, update the .docx too so both stay identical.

## OpenSpec workflow

Development is spec-driven with OpenSpec (CLI `openspec`, v2.x, schema `spec-driven`).

- `openspec/specs/<capability>/spec.md` — one spec per capability (autenticacion-usuarios, control-acceso, gestion-categorias, gestion-cuentas, gestion-movimientos, consulta-movimientos, dashboard-indicadores, presupuestos, reportes-exportacion; `definir-arquitectura-base` adds contrato-api, plataforma-proyecto and interfaz-usuario when archived). Each `Requirement` cites its origin story (`Origen: HU-xx`), keep that traceability when adding or changing requirements.
- `openspec/changes/` — in-progress change proposals; completed ones go to `openspec/changes/archive/`.
- Workflow skills live in `.claude/skills/` (mirrored in `.agents/skills/` for other agents — keep both in sync if edited): `openspec-propose` → `openspec-apply-change` → `openspec-sync-specs` / `openspec-archive-change`, plus `openspec-explore` and `openspec-update-change`. New features should go through a change proposal rather than editing code or main specs directly.

Useful CLI commands:

```sh
openspec list                 # active changes (--specs for specs)
openspec show <name>          # show a change or spec
openspec validate --all       # validate specs and changes
openspec validate <name> --strict
```
