---
trigger: model_decision
---

# MMS Security

Canonical for security beyond RBAC matrices (`mms-rbac.md`) and auth shape (`mms-auth.md`).

## Threat model (current)

| Surface | Current | Risk | Target |
|---------|---------|------|--------|
| JWT storage | `localStorage` (SPA) | XSS can exfiltrate token | Document + mitigate XSS; evaluate httpOnly cookie session (`mms-migration-status.md`) |
| API auth | Bearer JWT on `/api/*` | Stolen token = full access until expiry | Short TTL + refresh rotation (target); rate limits on auth |
| Multi-tenant data | `t:{subdomain}:{key}` prefix | Cross-tenant read/write if host/header wrong | Always resolve tenant from `x-forwarded-host`; never trust client-supplied tenant id in body |
| Bulk sync | `POST /api/db/sync` | Large payload abuse | Admin-only + size limits (target) |

## Required on every auth/write change

- [ ] **`rbacService`** on new `/api/db/*` writes (`mms-rbac.md`)
- [ ] **Rate limit** `POST /api/auth/login` and `POST /api/auth/onboard` — use `@fastify/rate-limit` or equivalent; return `429` with stable `type`
- [ ] **Validate bodies** — Fastify JSON Schema (backend) or Zod (frontend before submit)
- [ ] **No secrets in logs** — passwords, tokens, `passwordHash`, PII dumps
- [ ] **CORS** — `ALLOWED_ORIGIN` in production (`mms-ops.md`); no `*` with credentials

## Tenant isolation

1. Backend resolves tenant from forwarded host / workspace context — not from arbitrary JSON fields.
2. Frontend `tenantLocalStoragePrefix` must match server key scheme (`mms-data-layer.md`, `mms-tenant.md`).
3. Apex routes must not read tenant `collections`/`objects` without explicit workspace context.
4. When adding routes that return collections, verify caller tenant matches storage prefix.

## Headers & transport (target)

| Control | Target |
|---------|--------|
| HTTPS | Required in production |
| `Strict-Transport-Security` | Enable at reverse proxy |
| `Content-Security-Policy` | Restrict script sources in production deploy |
| `X-Content-Type-Options` | `nosniff` at proxy |

Bearer JWT in SPA: CSRF not required on API if no cookie session — document this in deploy runbooks.

## Audit trail (target)

Settings, RBAC, and user mutations should append to an `audit_log` collection or table:

- `who` (user id), `what` (action + entity), `when` (ISO), `tenant`, `before`/`after` snapshot (diff or hash)

Until implemented: do not claim audit compliance in UI copy.

## Error responses

Use stable `type` codes (`auth_required`, `forbidden`, `validation_error`, …) — frontend maps to `t('errors.*')` (`mms-i18n.md`). Never return stack traces to clients in production.

## Checklist (PR)

- [ ] New write route has RBAC + validation
- [ ] Login/onboard rate limited if touching auth routes
- [ ] Tenant-scoped reads/writes verified for multi-tenant paths
- [ ] No token/password logging
