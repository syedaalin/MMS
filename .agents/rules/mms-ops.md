---
trigger: model_decision
---

# MMS Operations

## Prerequisites

- Node.js 22.5+ (backend uses native tooling; PostgreSQL via Docker or local install)
- pnpm 11.x (`packageManager` in root `package.json`)

## Commands (from repo root)

```bash
pnpm install          # install all workspaces
pnpm dev              # frontend + backend via turbo
pnpm build            # build shared → apps
pnpm typecheck        # tsc all packages
```

CI runs the same typecheck + frontend lint — see **`mms-ci.md`**.

Per-app:

```bash
cd apps/frontend && pnpm lint && pnpm typecheck
cd apps/backend && pnpm dev
```

## Environment

| Variable | App | Required |
|----------|-----|----------|
| `VITE_API_URL` | frontend | dev default via Vite proxy `/api` → `:3000` |
| `JWT_SECRET` | backend | **yes** — server refuses start without it |
| `DATABASE_URL` | backend | default `postgresql://postgres:postgres@localhost:5432/mms` |
| `ALLOWED_ORIGIN` | backend | production CORS |
| `NODE_ENV` | backend | `production` tightens CORS |
| `LOG_LEVEL` | backend | optional |

Add `.env.example` files when introducing new vars — never commit real `.env`.

## Database

- PostgreSQL — **not** SQLite (ignore stale `DATABASE_PATH` in Dockerfile until fixed).
- Drizzle migrations run on backend startup.
- Empty DB → seeds from `apps/backend/src/db/seeds.json`.

## Docker (backend)

`apps/backend/Dockerfile` is **outdated** (SQLite, npm-only) — tracked in `mms-migration-status.md`. Before production:

- pnpm workspace build (shared → backend)
- `DATABASE_URL` pointing at PostgreSQL service
- Remove stale `DATABASE_PATH` / SQLite references
- Match Node 22 + pnpm 11 from CI (`mms-ci.md`)

## API health

| Endpoint | Purpose |
|----------|---------|
| `GET http://localhost:3000/health` | Liveness — used by `AuthContext` on load |
| `GET /ready` | **Target** — DB connectivity for orchestrators (`mms-observability.md`) |

## Production deploy (target)

- Reverse proxy terminates TLS; sets `x-forwarded-host` for tenant resolution
- `ALLOWED_ORIGIN`, `JWT_SECRET`, `DATABASE_URL` from secrets manager — never in image layers
- Security headers at proxy — `mms-security.md`
