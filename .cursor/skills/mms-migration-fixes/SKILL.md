---
name: mms-migration-fixes
description: Addresses known MMS technical debt from mms-migration-status — auth seeds, nested ContactConfigProvider, DraggableFieldList duplicate, RBAC gaps. Use when the user asks to fix migration gaps, align rules with code, or tackle documented debt.
---

# MMS Migration Fixes

Only implement items **in scope** for the current task. Full list: `.cursor/rules/mms-migration-status.mdc`.

## Priority fixes

### P0 — Auth seeds

**Problem:** `seeds.json` users have `roles[]`, no `passwordHash`.

**Fix:** Align to `StoredUser` in `userService.ts`; hash dev passwords or separate display-only seed users from auth users.

**Skill:** `mms-auth-users`

### P0 — Nested ContactConfigProvider

**Problem:** Extra providers in `Contacts.tsx`, `Settings.tsx`.

**Fix:** Remove wrappers; rely on `App.tsx` root provider only.

### P1 — DraggableFieldList duplicate

**Problem:** `ui/DraggableFieldList.tsx` vs `contacts/settings/DraggableFieldList.tsx`.

**Fix:** Merge contacts features into UI component; delete duplicate.

### P1 — RBAC

**Problem:** Any JWT can access `/api/db/*`.

**Fix:** Role middleware on write/reset routes; centralise `can()` on frontend.

### P2 — Orphan code

Remove when touching: `PlaceholderPage` import, unrouted `Enrollment.tsx`, unused `ProtectedRoute`.

### P2 — Dockerfile

PostgreSQL + pnpm workspace — not SQLite.

## After each fix

```bash
pnpm typecheck
cd apps/frontend && pnpm lint  # if FE touched
```

Update `mms-migration-status.mdc` row if fully resolved.
