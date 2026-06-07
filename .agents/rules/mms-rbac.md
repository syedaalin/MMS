---
trigger: model_decision
---

# MMS RBAC

Canonical for permissions. UI visibility details → `mms-ui-visual.md`; auth JWT shape → `mms-auth.md`.

## Backend (current)

`apps/backend/src/services/rbacService.ts`:

| Check | Rule |
|-------|------|
| `canWriteCollection` | `users` → admin only; others → admin, accountant, teacher, assistant_teacher |
| `canWriteObject` | `global_settings`, `branding`, `email_integration` → admin only |
| `canBulkSync` | admin only |
| `/api/db/reset` | admin only |

Apply on every new destructive or collection write route — do not add open writes.

## Frontend (target)

```tsx
// ❌ Scattered role checks
{user.role === 'admin' && <Button>Delete</Button>}

// ✅ Central hook (implement usePermissions / can())
{can('contacts.delete') && <Button>Delete</Button>}
```

- Registry entries may include `permissions: string[]` on fields/tabs (see `mms-fields.md`).
- Forbidden UI **must not render** — not disabled placeholders (`mms-ui-visual.md`).

## Frontend (current)

- **`usePermissions()`** → `can(permission)` — shipped in `apps/frontend/src/hooks/usePermissions.ts`
- New UI gates use `can()`; legacy pages may still use **`useViewerRole()`** — migrate when touching a module
- Forbidden actions: **omit the control** (`mms-ui-visual.md`) — do not render disabled placeholders that leak capability hints
- Backend **`rbacService`** is authoritative; UI gates are additive only — never rely on UI-only hiding for security

## Permission strings (target)

Dot-notation keys aligned with module + action, e.g. `contacts.delete`, `settings.branding.write`, `users.manage`. Registry `permissions: string[]` on fields/tabs uses the same vocabulary (`mms-fields.md`).

## Workspace roles

System roles: `DEFAULT_WORKSPACE_ROLES` in `@mms/shared/userTypes.ts` — singular `role` on JWT `User`, not `roles[]`.

Users module RBAC matrix is **Configuration → Permissions** only (`RolesPermissions.tsx`).

## Audit (target)

RBAC and settings writes should log to `audit_log` — who changed roles, `global_settings`, `branding` (`mms-security.md`). Until table exists, document gap in PR if touching those paths.

## Checklist

- [ ] New `/api/db/*` write path calls `rbacService`
- [ ] New admin-only settings object keys listed in `canWriteObject`
- [ ] UI gates use `can()` or shared viewer hook — not raw role strings
- [ ] Denied action returns `403` + `type: forbidden` — not empty `200`
