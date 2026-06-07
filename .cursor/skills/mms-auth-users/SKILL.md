---
name: mms-auth-users
description: Fixes or extends MMS authentication, JWT, userService, seeds alignment, login/onboard, and RBAC. Use when editing auth routes, users collection, AuthContext, login, passwords, roles, or permissions.
---

# MMS Auth & Users Workflow

## Canonical stored user

```ts
{ id, email, name, role, passwordHash, createdAt }
// role: string — NOT roles[]
// passwordHash: scrypt "salt:hash" hex
```

Public API/JWT: `User` from `@mms/shared`.

## Fix seed mismatch (known debt)

`apps/backend/src/db/seeds.json` users use `roles[]` without `passwordHash`. Migration options:

1. Transform seed users to `StoredUser` with hashed dev passwords, or
2. Strip auth fields from seed display users and rely on `/api/auth/onboard`

`userExistsWithRole('admin')` checks `role === 'admin'` — seed `roles: ['admin']` does **not** count.

## Add auth-protected endpoint

1. Register route under plugin with `preHandler: jwtVerify`
2. Validate body with Fastify JSON Schema
3. Check role server-side for destructive ops
4. Return `{ type, message }` on error

## Frontend

- `AuthContext` — token in localStorage
- Route gate via `AuthenticatedApp` in `App.tsx`
- Never log tokens/passwords

## UI vs backend

2FA, `status`, multi-role UI in `components/users/` — implement backend before implying enforcement.

## Files

- `apps/backend/src/services/userService.ts`
- `apps/backend/src/services/authService.ts`
- `apps/backend/src/routes/auth.ts`
- `apps/frontend/src/lib/AuthContext.tsx`

## Rules

`.cursor/rules/mms-auth.mdc`
