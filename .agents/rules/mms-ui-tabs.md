---
trigger: model_decision
---

# MMS Tab Navigation

## Registry-driven tabs

Render only **enabled** tabs in **order** from the tab registry:

```tsx
{enabledTabs.map((tab) => (
  <TabsTrigger key={tab.key} value={tab.key}>{tab.label}</TabsTrigger>
))}
```

- Icons: resolve Lucide component from registry `icon` key
- Colours: from registry `color` — no per-tab hardcoded Tailwind accents

## Module tiers (shell only)

Use `useModuleTierTabs()` — three ids: `operations` | `analytics` | `configuration`. No fourth top-level tier.

**What goes inside each tier** → `mms-module-isolation.md` (canonical; do not duplicate here).

## PageHeader CTAs

```tsx
<PageHeader title="Contacts" actions={<ActionButton onClick={onAdd}>…</ActionButton>} />
```

- Primary page actions live in `PageHeader.actions` — not hidden behind `activeTab`.
- Tab-specific actions stay inside that tab’s content.

## Session persistence

Persist active module tab (and sub-tab where applicable) in session storage or user prefs — avoid reset on every route change.

## Extensibility

New tab = registry entry + content component. Do not rewrite shared tab shells per feature.

## Responsive mobile accordion (required)

All multi-tab shells use `ResponsiveAccordionTabs` from `components/ui/ResponsiveAccordionTabs.tsx`.

| Breakpoint | Behaviour |
|---|---|
| `< lg` (mobile/tablet) | Stacked section headings; tap expands **all tab content under that heading** |
| `≥ lg` (desktop) | Module pages: horizontal underline tabs; Settings: sidebar + panel |

```tsx
<ResponsiveAccordionTabs
  tabs={PAGE_TABS}
  activeTab={activeTab}
  onTabChange={setActiveTab}
  hideWhenSingle
  panelIdPrefix="module-tab"
>
  {/* sub-tabs + AnimatePresence content */}
</ResponsiveAccordionTabs>
```

- URL-driven sections (Settings): pass `href` on each tab item; use `desktopLayout="sidebar"`.
- Configuration / Operations sub-tabs: prefer `SubTabBar` with `children` for nested mobile accordion.
- **Banned:** inline `flex border-b` tab bars on pages — use the shared component only.

## SubTabBar (Operations / Configuration / Analytics inner tabs)

Use **`SubTabBar`** from `components/ui/SubTabBar.tsx` for inner tiers — not inline pill/`flex border-b` strips (`mms-migration-status.md`). Form modals use pill style via `FormModal` + `SubTabBar` (`mms-ui-forms.md`).

Tab labels from `t()` or registry `labelKey` — `mms-i18n.md`. Mobile accordion headings must be keyboard-activatable (`mms-a11y.md`).
