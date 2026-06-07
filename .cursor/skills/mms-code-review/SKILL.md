---
name: mms-code-review
description: Reviews MMS code against project rules, skills, and migration status. Use when reviewing PRs, doing a code review, checking rule compliance, or auditing changes before merge.
---

# MMS Code Review

## Automated checks

```bash
pnpm typecheck
cd apps/frontend && pnpm lint
```

## Checklist

### Architecture
- [ ] Shared types/utils in `@mms/shared` (not duplicated)
- [ ] No frontend → backend direct imports
- [ ] routes → services → database (backend)
- [ ] `useLiveCollection` for reactive collection reads

### UI / config
- [ ] No hardcoded labels/colours/status maps
- [ ] Fields/tabs from registry
- [ ] PageHeader.actions for page CTAs
- [ ] Module tier: Operations | Analytics | Configuration

### Field persistence (new/changed fields)
- [ ] Field on `@mms/shared` type + `DEFAULT_*` + merge helper
- [ ] Read via `getObject` / `getCollection` / typed settings getter
- [ ] Write reaches PostgreSQL (`saveCollection`, `saveObject`, or `await save*Settings()`)
- [ ] UI control bound to save path — not orphaned `useState`
- [ ] Seeds updated if field is part of default documents
- [ ] Reviewer can point to the exact DB write line (`rg` field key across layers)

### Contacts / providers
- [ ] No nested `ContactConfigProvider`
- [ ] No manual WhatsApp toggles
- [ ] E.164 phone normalization

### Auth / security
- [ ] No secrets in diff
- [ ] DTO validation on write endpoints
- [ ] User shape matches `StoredUser` if touching users/seeds
- [ ] No `any`; no silent catch
- [ ] `rbacService` on new writes; rate limit if touching login/onboard (`mms-security.mdc`)
- [ ] Tenant-scoped paths use forwarded host — not client tenant id in body

### Testing & observability
- [ ] New `@mms/shared` pure helpers have unit tests (`mms-testing.mdc`)
- [ ] API failures surfaced via `notify.error` + `t()`; heavy sections in `ErrorBoundary`

### Accessibility
- [ ] Icon buttons have `aria-label`; forms use `t()` labels (`mms-a11y.mdc`)

### Performance
- [ ] jspdf/xlsx/html2canvas dynamically imported
- [ ] Image uploads via `optimizeImage` (AVIF); canvas exports via `canvasToOptimizedDataUrl`. No direct `canvas.toDataURL`/`toBlob` or raw FileReader persistence

### Scope
- [ ] No drive-by refactors
- [ ] No unused imports in changed files

## Severity

- **Critical:** security, auth bypass, data loss, type errors
- **Major:** rule violations that will spread debt (new hardcoded fields, nested providers)
- **Minor:** style, optional DRY

## References

- Rules: `.cursor/rules/`
- Debt: `mms-migration-status.mdc`
- Skills: `.cursor/skills/`
