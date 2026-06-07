---
trigger: model_decision
---

# MMS Data Layer

## Architecture

| Layer | Storage |
|-------|---------|
| Backend | PostgreSQL tables `collections` (JSON arrays), `objects` (JSON singletons) |
| Frontend | `localStorage` keys `mms_*` via `apps/frontend/src/lib/db.ts` |

### Server-first trajectory (modern target)

| When | Pattern |
|------|---------|
| **Existing module CRUD** | Keep `useLiveCollection` + `saveCollection` until intentionally migrated |
| **New domain API** | Backend service + route → TanStack Query on FE; optional localStorage cache — `mms-query.md` |
| **Target end state** | PostgreSQL authoritative; browser cache invalidates via Query/WebSocket — not full-array local RMW |

Do not add new features that write only to React state or localStorage without a PostgreSQL path (`mms-fields.md` gate).

## Read / write

```ts
const rows = getCollection<Contact>('contacts', CONTACTS);
await saveCollection('contacts', updated);
await saveObject('global_settings', settings);
const live = useLiveCollection('students', STUDENTS); // preferred in components
```

After local writes that should refresh other views:

```ts
window.dispatchEvent(new Event('local-database-update'));
```

## Sync API (JWT required)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/db/sync` | Full snapshot |
| POST | `/api/db/sync` | Bulk upsert |
| GET/POST | `/api/db/collections/:name` | One collection |
| GET/POST | `/api/db/objects/:key` | One object |
| POST | `/api/db/reset` | Admin only — dev/test |

## Seeds

| Location | When |
|----------|------|
| `apps/backend/src/db/seeds.json` | Backend empty DB |
| `apps/frontend/src/lib/*Data.ts` | Frontend localStorage fallback |

Keep shapes aligned with `@mms/shared` and `userService` (`users` need `role` + `passwordHash`).

## Student hydration

`db.ts` hydrates students from linked contacts on read and strips duplicate fields on save — preserve this when editing student/contact linking.

## Concurrency

Collection saves are read-modify-write on the full array. Merge concurrent edits or serialize writes to the same collection.

## Field persistence

New/changed fields → full checklist in **`mms-fields.md`** only.

## Singleton settings persistence (required)

App-wide singletons (`branding`, `global_settings`) must **survive login sync** and land in PostgreSQL — not local-only.

| Key | Read helper | Save helper | Merge in `@mms/shared` |
|-----|-------------|-------------|------------------------|
| `branding` | `getBrandingSettings()` | `await saveBrandingSettings()` | `mergeBrandingSettings` |
| `global_settings` | `getGlobalSettings()` | `saveGlobalSettings()` (prefer async variant when user confirms save) | `mergeGlobalSettings` |

### Frontend rules

1. **Never** call raw `saveObject('branding', …)` from settings UI — use typed helpers in `db.ts`.
2. User-facing **Save** actions must **await** server sync (`POST /api/db/objects/:key`) and only show success after `ok: true`.
3. On failure, show `notify.error` (401 re-auth, 403 admin-only, network) — do not claim “saved”.
4. Always merge with defaults **before** local write and API payload.
5. Tenant hosts: keys are scoped via `tenantLocalStoragePrefix` / `t:{subdomain}:{key}` on the server (Vite proxy must send `x-forwarded-host`).

### Backend rules

1. `POST /api/db/objects/branding` — normalize with `mergeBrandingSettings` before `persistObject`.
2. After branding save, call `syncWorkspaceFromBranding` so apex workspace list (`madrasaName`, `tagline`) stays aligned.
3. RBAC: `branding` and `global_settings` writes are **admin only** (`rbacService.canWriteObject`).

### New singleton object checklist

- [ ] Type + `DEFAULT_*` + merge helper in `@mms/shared`
- [ ] `getX()` / `saveX()` (async, awaits sync) in `db.ts`
- [ ] Backend merge on persist if shape is user-edited
- [ ] Settings UI: saving state, success/error toasts, no false “saved”

## Tenant scoping

On tenant hosts, server persists `objects`/`collections` under `t:{subdomain}:{key}`. Vite dev proxy must forward `x-forwarded-host` so backend resolves the correct tenant (`mms-tenant.md`).

## Future

Custom fields/tabs will provision real columns/tables (see `mms-fields.md`). Until then, custom values live inside JSON documents + field registries in `objects`.
