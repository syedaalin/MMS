---
name: mms-dev-setup
description: Sets up and runs the MMS monorepo (pnpm, PostgreSQL, backend :3000, frontend :5173, typecheck, lint). Use when installing dependencies, starting dev servers, fixing env issues, or onboarding to the project.
---

# MMS Dev Setup

## Quick start

```bash
# From repo root
pnpm install
pnpm dev                         # turbo: backend + frontend (foreground)
./restart_servers.sh             # recommended: Postgres + restart + health check
./restart_servers.sh --quick     # skip cache clear / health wait
./scripts/stop_servers.sh        # stop servers started by restart script
```

## Verify environment

```bash
bash .cursor/skills/mms-dev-setup/scripts/verify-env.sh
```

## Required env (backend)

| Variable | Notes |
|----------|-------|
| `JWT_SECRET` | **Required** — server exits without it |
| `DATABASE_URL` | Default `postgresql://postgres:postgres@localhost:5432/mms` |

Create `apps/backend/.env` (never commit). Frontend uses Vite proxy `/api` → `:3000`.

## PostgreSQL

```bash
# If using Docker (restart_servers.sh auto-starts mms-postgres if present)
docker start mms-postgres
```

Empty DB auto-seeds from `apps/backend/src/db/seeds.json` on backend startup.

## Quality gates

```bash
pnpm typecheck              # all packages (builds @mms/shared first)
cd apps/frontend && pnpm lint && pnpm typecheck
cd apps/backend && pnpm typecheck
```

## Layout

```
apps/frontend/   React 19 + Vite
apps/backend/    Fastify 5 + PostgreSQL
packages/shared/ @mms/shared
```

## Rules reference

See `.cursor/rules/mms-ops.mdc` and `mms-core.mdc`.
