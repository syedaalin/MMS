---
trigger: model_decision
---

# MMS Database

## Stack

- PostgreSQL (`DATABASE_URL`) — **not SQLite**
- Drizzle ORM — `apps/backend/src/db/schema.ts`
- Pool via `pg` in `database.ts`

## Current schema

```ts
collections(name PK, data text)  // JSON stringified arrays
objects(key PK, data text)       // JSON stringified singletons
```

## Migrations

| Type | Location | Rule |
|------|----------|------|
| DDL | `migrations_drizzle/` via drizzle-kit | One atomic migration per schema change |
| Data | `migrations/00N_*.ts` | Idempotent TypeScript transforms |

- Applied on startup in `initDb()`.
- No raw SQL in application code.
- No batched retroactive manual SQL files.

## Seeds

`seeds.json` + `seeds.ts` — when `collections` table is empty.

Align with `@mms/shared` defaults and `StoredUser` shape (`role`, `passwordHash`).

## Access pattern

```
route handler → service → database.ts (getCollection/saveCollection/getObject/saveObject)
```

Never import `pg` in route files.

## resetDatabase

`POST /api/db/reset` — admin JWT only. Drops `__drizzle_migrations` and reseeds. Dev/test only.

## Future relational custom fields

When implementing custom tabs/fields per `mms-fields.md`: add real `pgTable` definitions, one drizzle-kit migration per change, keep document store for legacy collections until migrated.

## Audit & compliance (target)

`audit_log` table: `id`, `tenant`, `userId`, `action`, `entityType`, `entityId`, `payload`, `createdAt` — append-only; no updates/deletes except retention job (`mms-security.md`).
