---
name: mms-data-sync
description: Works with MMS localStorage layer (db.ts), useLiveCollection, backend /api/db sync, seeds, and collection/object storage. Use when reading or writing app data, fixing stale UI, or syncing frontend with PostgreSQL.
---

# MMS Data Sync Workflow

## Frontend (`apps/frontend/src/lib/db.ts`)

```ts
import {
  getCollection, saveCollection,
  getBrandingSettings, saveBrandingSettings,
  getGlobalSettings, saveGlobalSettings,
} from './db';

const items = getCollection<MyType>('collection_key', SEED_ARRAY);

import { useLiveCollection } from '../hooks/useLiveCollection';
const items = useLiveCollection('collection_key', SEED_ARRAY);

// Singleton settings — await server sync on explicit Save
const result = await saveBrandingSettings(getBrandingSettings());
if (!result.ok) { /* notify.error */ }
```

## Backend document store

| Table | Content |
|-------|---------|
| `collections` | Named JSON arrays (`contacts`, `students`, `users`, …) |
| `objects` | Named JSON singletons (`global_settings`, `contact_field_config`, …) |

## API (JWT required)

- `GET/POST /api/db/collections/:name`
- `GET/POST /api/db/objects/:key`
- `GET/POST /api/db/sync`

## Add new collection

1. Seed in `apps/backend/src/db/seeds.json` + frontend `*Data.ts`
2. Type in `@mms/shared` if shared shape
3. Read/write via `getCollection` / `saveCollection`
4. Use `useLiveCollection` in UI

## Concurrency

Full-array read-modify-write — merge concurrent edits to same collection.

## Student hydration

`db.ts` hydrates students from linked contacts — preserve when editing student/contact links.

## Branding / global settings

- Use `getBrandingSettings()` / `await saveBrandingSettings()` — never raw `saveObject('branding')` in settings UI.
- Success only after `POST /api/db/objects/branding` returns ok; `notify.error` on failure.
- Backend merges branding and runs `syncWorkspaceFromBranding`; admin-only writes.

## Rules

`.cursor/rules/mms-data-layer.mdc`
