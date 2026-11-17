# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

"Dashboard de Finanzas Personales" is a university project (UC) that is currently **requirements-only**: there is no application code, package manifest, build, lint or test setup yet. The repo holds user stories and OpenSpec specs that will drive implementation. When code is added, update this file with the real commands and architecture.

**Tech stack: MERN** — MongoDB (database), Express (REST API), React (frontend), Node.js (runtime). Use it for every proposal, design and implementation; don't introduce other backend frameworks, databases or frontend libraries that replace these.

The specs also fix these technical points, which the implementation must respect:

- Express REST API with JWT authentication; roles `usuario estándar` and `administrador` (RBAC), with the role re-validated in the API (middleware/service layer), not just hidden in the React UI.
- Multi-tenant data isolation: every MongoDB document for movements, accounts, categories and budgets carries its owner's `userId`/`tenantId`, and every query filters by the authenticated user's id at the data-access layer (requests for another user's resource return 403/404 without leaking data).
- React frontend uses Chart.js for dashboard charts and SweetAlert2 for confirmation dialogs.
- Reports exportable to PDF and Excel.

## Language

All project artifacts (specs, proposals, designs, tasks, docs, commit messages) are written in **Spanish**. In OpenSpec files, keep the structural headings (`## Purpose`, `## Requirements`, `### Requirement:`, `#### Scenario:`) and the keywords `SHALL`/`MUST`/`GIVEN`/`WHEN`/`THEN` in English (configured in [openspec/config.yaml](openspec/config.yaml)).

## Branches and commits

Follows [docs/Los prefijos en las ramas.pdf](docs/Los%20prefijos%20en%20las%20ramas.pdf) (Git Flow + Conventional Commits).

**Long-lived branches**

- `main` — only finished, working functionality. Never commit or develop directly on it; it only receives merges from `dev` (or a `release/` branch) once a set of features is ready, plus `hotfix/` merges.
- `dev` — integration branch. **Every work branch starts from `dev` and merges back into `dev`.** Never commit directly on it either.
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

**Naming:** all lowercase, words separated by hyphens (no spaces or underscores), short Spanish description. Include the user-story ID when the branch implements one: `feature/hu-08-registrar-movimiento`, `fix/hu-02-bloqueo-intentos`, `docs/actualizar-guia-instalacion`.

**Commits:** Conventional Commits in Spanish, using the same types as the prefixes — `<tipo>: <descripción en imperativo>` (`feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `ci`), optionally with a scope (`feat(movimientos): ...`) and a bullet body explaining the why. The commit type should match the branch prefix (`feature/` → `feat:`).

## Requirements sources

- [docs/historias-de-usuario.md](docs/historias-de-usuario.md) is the source of truth for requirements: 17 user stories (HU-01 … HU-17) grouped into 9 epics, each with exactly 4 Gherkin scenarios (camino feliz, flujo alternativo, manejo de errores, caso de borde). Its final section "Supuestos y Vacíos Detectados" lists open assumptions (JWT/reset-link expiry of 30 min, 90% budget alert threshold, HU-09 being an extra story, admin can view but not edit other users' movements) — check it before deciding those behaviours.
- `docs/HU_Dashboard_Finanzas_Personales_editado.docx` is the original document the Markdown was converted from; edit the Markdown, not the .docx.

## OpenSpec workflow

Development is spec-driven with OpenSpec (CLI `openspec`, v2.x, schema `spec-driven`).

- `openspec/specs/<capability>/spec.md` — one spec per epic (autenticacion-usuarios, control-acceso, gestion-categorias, gestion-cuentas, gestion-movimientos, consulta-movimientos, dashboard-indicadores, presupuestos, reportes-exportacion). Each `Requirement` cites its origin story (`Origen: HU-xx`), keep that traceability when adding or changing requirements.
- `openspec/changes/` — in-progress change proposals; completed ones go to `openspec/changes/archive/`.
- Workflow skills live in `.claude/skills/` (mirrored in `.agents/skills/` for other agents — keep both in sync if edited): `openspec-propose` → `openspec-apply-change` → `openspec-sync-specs` / `openspec-archive-change`, plus `openspec-explore` and `openspec-update-change`. New features should go through a change proposal rather than editing code or main specs directly.

Useful CLI commands:

```sh
openspec list                 # active changes (--specs for specs)
openspec show <name>          # show a change or spec
openspec validate --all       # validate specs and changes
openspec validate <name> --strict
```
