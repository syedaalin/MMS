---
trigger: model_decision
---

# MMS Testing

## Current state

`pnpm test` runs Vitest in `@mms/shared` and `mms-backend` (rbac + `/health`/`/ready`). No e2e or broad route coverage yet — adopt incrementally per table below.

## What to test (priority)

| Layer | Tool (target) | Scope |
|-------|---------------|-------|
| `@mms/shared` pure helpers | Vitest | `formatDate`, `parsePhoneNumber`, `mergeGlobalSettings`, `mergeBrandingSettings`, validators |
| Backend services | Vitest + test DB or mocks | `userService`, `rbacService`, `authService`, merge/normalize on persist |
| API routes | Fastify `inject()` | Auth, RBAC denial, validation errors, tenant key scoping |
| Frontend hooks | Vitest + RTL | `useTranslation`, `useSortedFields` (pure wrappers) |
| Critical flows | Playwright (target) | Login, onboard, save settings, contact create |

## Conventions

- Colocate: `foo.test.ts` next to `foo.ts`, or `__tests__/foo.test.ts`
- **No `any`** in tests — same strict TS as production
- Prefer testing **pure functions** in `@mms/shared` first (highest ROI, no UI)
- Mock `localStorage` / `fetch` at boundaries — do not hit production APIs in unit tests
- Seeds: use minimal fixtures aligned with `StoredUser` shape (`mms-auth.md`)

## When agents must add tests

| Trigger | Requirement |
|---------|-------------|
| User explicitly asks | Add tests per request |
| New non-trivial pure export in `@mms/shared` | Unit test in same PR |
| Bug fix in shared merge/validation logic | Regression test |
| New RBAC or auth rule | Route test proving deny/allow |

Otherwise: `antigravity-global.md` — tests not required for UI-only changes.

## CI (target)

When `pnpm test` exists at root:

```yaml
- run: pnpm test
```

Until then, `mms-ci.md` runs typecheck + frontend lint only.

## Banned

- Tests that depend on real WhatsApp / Puppeteer in CI
- Committing `.env` or live credentials in fixtures
- Snapshot tests of entire pages (brittle) — prefer interaction tests on critical paths

## Checklist (when adding tests)

- [ ] `pnpm test` passes locally
- [ ] New shared pure helpers have at least one happy + one edge case
- [ ] Auth/RBAC tests cover `403`/`401` response `type`
