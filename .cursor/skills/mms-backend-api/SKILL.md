---
name: mms-backend-api
description: Adds or modifies Fastify routes, services, validation, and WhatsApp integration in the MMS backend. Use when creating API endpoints, db sync, contacts route, error handling, or backend services.
---

# MMS Backend API Workflow

## Layering

```
apps/backend/src/routes/*.ts  →  services/*.ts  →  db/database.ts
```

Never query `pg` from route handlers.

## Add collection endpoint (typical)

Most data uses existing `/api/db/collections/:name` — no new route needed.

For side effects (like contacts): dedicated route in `routes/contacts.ts` + service.

## New route plugin

1. Create `routes/myFeature.ts` with `FastifyPluginAsync`
2. `preHandler` for `jwtVerify` if protected
3. JSON Schema on body/params
4. Error: `{ type: 'validation_error', message: '…' }` + correct status code
5. Register in `app.ts` with prefix

## Contacts pattern

`POST /api/contacts`: normalize phones, title-case, enqueue WhatsApp check.

## WhatsApp

`whatsAppService` → `whatsAppQueue` → `PuppeteerWhatsAppProvider.getNumberId`

Mock provider behind env var for dev only.

## Security

- `JWT_SECRET` required
- Role check on `/api/db/reset` and future destructive routes
- No secrets in logs
- `unknown` + narrowing — not `any`

## Verify

```bash
cd apps/backend && pnpm typecheck && pnpm dev
curl http://localhost:3000/health
```

## Rules

`.cursor/rules/mms-backend.mdc`, `mms-database.mdc`
