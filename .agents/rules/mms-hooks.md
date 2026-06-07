---
trigger: model_decision
---

# MMS Hooks

## `useLiveCollection(key, seed)`

Reactive read of a localStorage collection. Subscribes to `local-database-update`.

```ts
// ✅ Reactive
const students = useLiveCollection('students', STUDENTS);

// ❌ Stale after external saves
const [students] = useState(() => getCollection('students', STUDENTS));
```

Use when a component must refresh when another view saves the same collection.

## `useSortedFields(registry, tabKey?)`

Returns fields filtered by `enabled`, sorted by `order`, optionally scoped to a tab. Use in forms with `FormPrimitives` — not hardcoded field lists.

## `useGlobalSettings()`

Reactive read of `global_settings` (incl. `enabledModules`, theme). Subscribes to `local-database-update`. Use in Sidebar, QuickActions, and any UI that filters by enabled modules.

```ts
const { enabledModules, theme } = useGlobalSettings();
```

Prefer `getGlobalSettings()` for one-shot reads outside React (merges with defaults).

## `useBranding()`

Reads branding CSS variables from `branding` object + `useBranding` injection. Do not hardcode primary colours in components.

## `useContactConfig()` / `useContactColumns()`

From `ContactConfigContext.tsx`. Requires provider at `App.tsx` root — never nest another provider on child pages.

## `useBodyScrollLock(active?)`

Locks background page scroll while a modal/overlay is mounted (reference-counted, scrollbar-width compensated). Call in every overlay; pass the open state for animated dialogs (`useBodyScrollLock(open)`). Pair with `overscroll-contain` on the scroll body. Never set `document.body.style.overflow` manually.

## `useTranslation()`

Returns `t`, `lang`, `dir`. **All new user-facing copy** uses `t('key')` — see `mms-i18n.md`. Entry paths force English regardless of stored language.

## `usePermissions()` / `can()`

Central permission hook — see `mms-rbac.md`. Delegates to `@mms/shared` `roleHasPermission`. Prefer `can('module.action')` over new inline `user.role ===` checks. Module-specific viewer tiers may still use `useViewerRole()` until registry-driven matrix covers all cases.

## `useSettingsDraft` / preview hooks

Settings panels: `useSettingsDraft` + `onPreview` — see `mms-config.md`. Listens to `settings-preview-update` via `useGlobalSettings` / `useBranding`.

## `useWorkspaceRegistry()`

TanStack Query for apex workspace list — reference implementation (`mms-query.md`). New server-backed hooks follow this pattern.

## New hooks

- Colocate in `apps/frontend/src/hooks/`
- If used in 2+ modules → move logic to `@mms/shared` (pure functions) and keep hook as thin wrapper
- No polling inside hooks — use events or TanStack Query
