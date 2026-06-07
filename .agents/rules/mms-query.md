---
trigger: model_decision
---

# MMS Data Fetching (TanStack Query)

## Choose the right layer

| Data | Pattern | Rule owner |
|------|---------|------------|
| Local collections (`mms_*` / sync API) | `useLiveCollection` + `saveCollection` | `mms-data-layer.md` |
| New REST endpoints (auth, workspace, future APIs) | `useQuery` / `useMutation` | this file |
| Cross-view refresh (local) | `local-database-update` event | `mms-data-layer.md` |

**Banned:** bare `fetch` in `useEffect` for server state; `setInterval` polling (`mms-core.md`).

## Query conventions

```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

useQuery({
  queryKey: ['workspace', 'registry'],
  queryFn: () => fetchWorkspaces(),
  staleTime: 30_000,
});
```

- **Keys:** stable tuples — `['entity', id, filters?]`.
- **Mutations:** `onSuccess` → `queryClient.invalidateQueries` for affected keys.
- **Errors:** surface via `notify.error` with `t()` — no silent failure.
- **Loading:** use Query `isPending` / `isFetching` — not parallel one-shot `useState` loaders.

## Scope

- Existing module CRUD on `/api/db/collections/*` stays on `useLiveCollection` until migrated intentionally.
- **New modules/features** with dedicated backend routes: **Query-first** — server is source of truth; invalidate cache on mutation (`mms-data-layer.md` trajectory).
- Apex workspace registry (`useWorkspaceRegistry`) is the reference Query implementation.
- Auth/session checks on load: `AuthContext` health + `/api/auth/me` — not a substitute for collection reads (`useLiveCollection`).

## Checklist (new API feature)

- [ ] `useQuery` or `useMutation` — not manual `useEffect` + `fetch`
- [ ] Query key documented in hook export
- [ ] DTO types from `@mms/shared`
- [ ] Invalidation on writes
