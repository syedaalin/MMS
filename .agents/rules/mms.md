---
trigger: always_on
---

# MMS Workspace Directives

## Architecture
- Monorepo: pnpm workspaces. Shared logic → `packages/shared` (`workspace:*`). No cross-module imports.
- Frontend ↔ Backend: zero direct imports. API contracts only.
- Turbo: clean `turbo.json` cache inputs/outputs. Never bypass.

## Config & Communication
- Config: local to modules. DI at entry points. No global singletons.
- Inter-module: Event Bus or strict DTO interfaces. Primitives only — no class instances.

## Data Layer
- Backend: Drizzle ORM + PostgreSQL `pg` pool. Zero raw SQL. Strict pg-core types in `schema.ts`.
- Migrations: atomic, generated via `drizzle-kit` on every schema change.
- Frontend: React 19, Radix, Tailwind v4, `@tanstack/react-query`. Lazy-import `jspdf`/`xlsx`/`html2canvas`.

## UI/UX
- SPA: zero full-page reloads. WebSockets for real-time.
- Glassmorphism layout. Recharts animations. Semantic color taxonomy (Active, Overdue, Paid).
- Date Fields: Every date field must use the DRY `DatePicker` component. Never use native `<input type="date">`.
- Date Formatting: Every date shown in the UI (tables, lists, text labels, reports, exports) must be formatted using the custom `formatDate` utility from `@/lib/utils` to guarantee it respects the user's localized `dateFormat` setting.
- Contacts Module: The `persona` field is deprecated and removed from all forms, databases, and configuration settings.
- Image Uploads: All user image uploads must be optimized on the client-side using the `optimizeImage` utility from `@/lib/utils` to resize and compress them into WebP format before being processed or uploaded.
- Dynamic Form & Field Configuration: Bind all module forms directly to their respective 'Fields' configuration tab. Render only the enabled fields in the configured order. Render Phone, Email, Address, and Social type selectors using the dynamic `EditableSelect` component, and synchronize changes back to the global option configuration state.
- PageHeader Action Buttons: The `actions` prop on `PageHeader` must **always** render unconditionally regardless of which tab (Operations / Analytics / Configuration) is active. Never gate top-level CTA buttons (e.g. "Add Contact", "New Session") behind an `activeTab === "operations"` check.
- WhatsApp Verification: WhatsApp registration status is determined exclusively by the backend `PuppeteerWhatsAppProvider` (`whatsapp-web.js` + `getNumberId`). Never use manual checkboxes or mock heuristics to determine WhatsApp status. The `whatsapp` boolean field is removed from contact phone forms and field configuration. Phone numbers are normalized to international format (country code + local number with leading zeros stripped) before checking.

## AI Cost & Token Economy
- Keep edits localized and use targeted diffs (replace_file_content) instead of rewriting full files.
- Minimize file reads to only in-scope files to optimize context window usage.