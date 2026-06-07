---
trigger: always_on
---

# MMS Migration Status

Rules describe **target architecture**. Open gaps below — fix when the task covers them.

| Area | Current state | Target (rules) |
|------|---------------|----------------|
| Hardcoded labels/colours | Widespread in modules | Config/registry + `t()` — `mms-i18n.md` |
| Contact `uiStrings` map | Contacts module toasts/labels | New copy → `appTranslations` + `t()`; no new `uiStrings` keys |
| TanStack Query | Barely used (`PageNotFound` mock only) | New API work via Query — `mms-query.md` |
| `can()` permissions hook | Shipped; Enrollments + Attendance wired; registry partial | Full registry-driven matrix — `mms-rbac.md` |
| Inline `role ===` checks | Dashboard + some modules remain | `can()` / `useViewerRole` — `mms-rbac.md` |
| Custom tab provisioning | JSON document store only | Table + migration + CRUD per custom tab — `mms-fields.md` |
| WebSockets | Not implemented | Replace polling for server push — `mms-core.md` |
| Operations/Analytics sub-tabs | Residual inline bars in deep components | `SubTabBar` per `mms-ui-tabs.md` |
| `category="academic"` in reports/KPI | Removed from module pages | Module-specific categories only (`mms-module-isolation.md`) |
| Legacy entity forms | ObligationModal, some detail drawers | `FormModal` — `mms-ui-forms.md` |
| Status colours inline | Many `text-green-500` / `text-red-500` | `StatusBadge` + config — `mms-ui-visual.md` |
| Automated tests | Shared + backend rbac/health; no e2e yet | Vitest + route tests + CI `pnpm test` — `mms-testing.md` |
| Server-first data | localStorage primary; students count pilot | Query + API authoritative for new modules — `mms-data-layer.md` |
| Per-entity REST API | Generic `/api/db` + `/api/students/count` pilot | Resource routes + validation per domain — `mms-backend.md` |
| Global a11y pass | Partial (dropdowns only) | WCAG baseline on new UI — `mms-a11y.md` |
| JWT in localStorage | Current SPA pattern | Evaluate httpOnly session + refresh rotation — `mms-security.md` |
| Client error reporting | Console/toasts only | Sentry or equivalent — `mms-observability.md` |

## Recently resolved

| Area | Resolution |
|------|------------|
| Auth seeds | `getDefaultCollectionsForSeed()` normalizes `roles[]` → `role` + `passwordHash` on DB seed |
| RBAC | `rbacService` on `/api/db/*` writes, bulk sync, reset |
| `ContactConfigProvider` | Single mount in `App.tsx` only |
| `DraggableFieldList` | `ui/ContactDraggableFieldList` + `ui/DraggableFieldList` |
| `useLiveCollection` | Module pages migrated from one-shot `getCollection` |
| Dockerfile / README / CI | pnpm monorepo, PostgreSQL, `.github/workflows/ci.yml` |
| `contact.md` | Aligned with `@mms/shared` + `FormPrimitives` |
| `Enrollment.tsx` | Removed; `/enrollments` → `Enrollments.tsx` |
| Orphan route guards | Removed duplicate guards and deleted `PlaceholderPage`; canonical `ProtectedRoute` kept in `components/routing/` (`HostRoutes`) |
| Settings page module panels | Removed; module config only in each module's Configuration tab |
| Settings scope | `/settings`: global · modules · branding · theme · backup (`SETTINGS_SECTIONS`) |
| System Modules layout | `SYSTEM_MODULE_NAV` mirrors nav; Academics group; registry in `@mms/shared` |
| Attendance nav | Under Academics group in `navConfig.tsx`, not top-level |
| Branding local-only save | `getBrandingSettings` / `await saveBrandingSettings`; server merge + `syncWorkspaceFromBranding`; no false “saved” UI |
| Settings live preview | `settingsPreview` + `useSettingsDraft`; global/modules/branding preview before Save; revert on leave `/settings` |
| Auth rate limiting | `@fastify/rate-limit` on `/api/auth/login` and `/api/auth/onboard` |
| Audit log | `audit_log` collection on `users`, `global_settings`, `branding` writes |
| Readiness probe | `GET /ready` with PostgreSQL ping |
| `usePermissions` / `can()` | `apps/frontend/src/hooks/usePermissions.ts` + `@mms/shared` matrix |
| `SubTabBar` (Finance, Attendance, Obligations) | Inline pill bars replaced |
| `FormModal` (StudentForm, JournalEntryForm) | Legacy overlay shells migrated |
| Contacts tier tabs | `useModuleTierTabs()`; delete toasts via `t()` |
| CI `pnpm test` | Turbo `test` task + shared Vitest in workflow |
| `.env.example` | Root + `apps/frontend` + `apps/backend` |
| Backend ESLint | `apps/backend/eslint.config.js` + CI lint step |
| SubTabBar (Accounting, Enrollments, Hasanat, Sessions, Students, Contacts config) | Inline pill bars replaced |
| AccountModal → FormModal | Chart of accounts add/edit dialog |
| Enrollments `can('enrollments.write')` | Replaces accountant role string checks |
| Attendance tier tabs via `can()` | Configuration/analytics visibility |
| Contacts page header i18n | `t()` for title, subtitle, actions |
| Contacts toolbar/stats i18n | Toolbar, column customizer, stats cards, avatar alt via `t()` |
| Contacts collection form tab i18n | Phone, email, address, social collection controls via `t()` |
| Contacts form primitives + relation i18n | FormPrimitives, Basic, Relationships, Emergency visible copy via `t()` |
| Backend route tests | `/health`, `/ready`, `rbacService` Vitest |

Do not reintroduce resolved violations.
