---
name: mms-module-page
description: Creates or modifies MMS module pages with Operations, Analytics, and Configuration tabs, PageHeader CTAs, and settings panels. Use when adding a new module, module page, settings panel, or the standard three-tier tab layout.
---

# MMS Module Page Pattern

## Required structure

```
Operations  |  Analytics  |  Configuration
                                    └─ Fields | Preferences
```

Reference implementations: `apps/frontend/src/pages/Contacts.tsx`, `Students.tsx`, `Finance.tsx`.

## Checklist

```
- [ ] Page in apps/frontend/src/pages/ — lazy route in App.tsx
- [ ] Nav entry in `lib/navConfig.tsx` (standalone or Academics `subItems`; set `moduleId`)
- [ ] Registry: `SYSTEM_MODULES` + `SYSTEM_MODULE_NAV` + `enabledModules` default in `@mms/shared`
- [ ] PageHeader with unconditional actions in .actions
- [ ] Operations: CRUD/list views
- [ ] Analytics: ModuleReports / KPI components from components/reports/
- [ ] Configuration: *Settings panel (Fields + Preferences sub-tabs)
- [ ] Data via getCollection / useLiveCollection — not one-shot useState
- [ ] Module settings object: {module}_settings via saveObject
- [ ] Types/settings defaults in packages/shared/src/settingsTypes.ts
```

## New module settings

1. Add `XxxSettings` interface + `DEFAULT_XXX_SETTINGS` in `@mms/shared/settingsTypes.ts`
2. Export from `packages/shared/src/index.ts`
3. Seed object key in backend seeds if needed
4. Create `components/xxx/XxxSettings.tsx` using `CustomFieldsBuilder` + `DraggableFieldList`

## Responsive tabs

Wrap tier navigation in `ResponsiveAccordionTabs` — mobile accordion under each heading, desktop horizontal tabs. See `rules/mms-ui-tabs.md`.

## Module isolation

Each tier is **module-scoped only** (`rules/mms-module-isolation.md`):

| Tier | Content |
|------|---------|
| Operations | CRUD, lists, wizards — no KPIs or reports |
| Analytics | `KPISummary(moduleCategory)` + `ModuleReports` / module charts |
| Configuration | `{module}_settings`, fields, preferences |

- `KPISummary` **inside Analytics tab only** — never above the tier tabs.
- Use the module's own `category` (not `academic`). See isolation rule for the mapping table.
- No cross-module Operations imports (e.g. Hasanat payouts on Finance).

## Do not

- Add a fourth top-level tab
- Gate PageHeader CTAs on `activeTab`
- Mount `*Settings` under `/settings` — Configuration tab only (see `mms-settings-navigation.md`)
- Hardcode column/field lists — use registry
- Hand-roll `flex border-b` tab bars — use `ResponsiveAccordionTabs`
- Put reports/KPIs/widgets from other modules in any tier

## Rules

`mms-module-isolation.md`, `mms-ui-tabs.md`, `mms-settings-navigation.md`, `mms-config.md`, `mms-fields.md`
