---
trigger: model_decision
---

# MMS Multi-Tenant Routing

## Hosts

| Host | App surface |
|------|-------------|
| Apex (`localhost`, `madrasa.app`, no subdomain) | Landing, workspace gate, onboarding — **not** tenant CRM |
| Tenant (`{slug}.localhost`, `{slug}.madrasa.app`) | Full MMS app for one madrasa |

Detect via `TenantContext` / `isTenantHost()` / `themeScope.ts`.

## Routing

- **Apex:** `ApexLanding`, `ApexWorkspaceGate`, auth entry — use `GuestRoute` / `HostRoutes`.
- **Tenant:** `TenantGate` wraps authenticated app; subdomain selects workspace.
- **API:** Vite proxy sends `x-forwarded-host`; backend scopes `objects`/`collections` by tenant prefix.

## Storage scope

- Tenant localStorage keys: `t:{subdomain}:{key}` (see `mms-data-layer.md`).
- Apex must not read/write tenant branding or `global_settings` overlays — `DEFAULT_BRANDING_SETTINGS` on apex (`mms-config.md` theme scope).

## Auth handoff

Workspace selection / auth handoff flows use `workspaceService` + `/api/workspace` + dedicated apex routes — do not stash tenant tokens on apex localStorage.

Apex workspace list uses TanStack Query (`useWorkspaceRegistry`) — `mms-query.md`.

## Security

Cross-tenant access is a **severity-critical** bug. When touching tenant resolution or storage keys:

- [ ] Verify `x-forwarded-host` drives prefix — not client body fields (`mms-security.md`)
- [ ] Apex cannot read arbitrary tenant collections without workspace auth handoff

## Banned

- Mounting full module pages on apex host
- Using tenant `getGlobalSettings()` for apex marketing pages
- Cross-tenant collection reads without subdomain in the storage key
