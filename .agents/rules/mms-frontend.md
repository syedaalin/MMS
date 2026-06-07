---
trigger: model_decision
---

# MMS Frontend

App shell, bundles, and cross-cutting FE concerns. Specialized rules (`mms-ui-*`, `mms-contacts`, `mms-i18n`, etc.) own module/UI detail — this file complements them on shell and performance.

## Bundle size

Dynamic `import()` for heavy libs — never static entry imports:

- `jspdf`, `jspdf-autotable`, `xlsx`, `html2canvas`

## Images

Every image upload **must** be optimized client-side before persisting/uploading — single source of truth in `@mms/shared`:

- File inputs → `optimizeImage(file)` (resizes + encodes **AVIF**, falls back to WebP → original).
- Canvas exports (croppers, generated images) → `canvasToOptimizedDataUrl(canvas, quality)` (AVIF → WebP).
- Never call `canvas.toDataURL("image/webp"|"image/png")` or `canvas.toBlob` directly, and never persist a raw `File`/data URL straight from `FileReader`. Route through the shared helpers so format is consistent everywhere.

## Routing (`App.tsx`)

- Lazy-load pages with `React.lazy` + `Suspense`.
- No orphan pages without routes (`Enrollment.tsx` vs `Enrollments.tsx`).
- Keep a **single** route-guard tree via `components/routing/HostRoutes` — remove dead imports (`PlaceholderPage`, duplicate `ProtectedRoute` wrappers) when editing `App.tsx`; do not delete `ProtectedRoute.tsx` itself (`mms-auth.md`).

## Data fetching

| Data source | Pattern |
|-------------|---------|
| New REST endpoints | TanStack Query — **`mms-query.md`** |
| Local collections | `getCollection` / `useLiveCollection` — **`mms-data-layer.md`** |
| Cross-view refresh | `local-database-update` event |

Avoid bare `fetch` in `useEffect` for server state.

## Real-time

- **Now:** event bus for localStorage sync
- **Target:** WebSockets for server push
- **Banned:** `setInterval` polling loops

## Responsive

- Mobile-first Tailwind breakpoints
- Min 44×44px touch targets
- Modals/drawers usable at 320px width
- Flex/Grid + `min-w-0` — prevent overflow horizontal scroll

## Resilience & a11y

- Wrap lazy route `Suspense` fallbacks with accessible loading text (`t('common.loading')`)
- Module pages: `ErrorBoundary` on Operations/Analytics content (`mms-observability.md`)
- New UI: keyboard + `aria-label` baseline — `mms-a11y.md`

## Bundle budget (target)

Track main chunk size on `pnpm build`; heavy libs stay dynamic (`jspdf`, `xlsx`, `html2canvas`). Investigate regressions > 10% without new features.

## Quality gate

After substantive edits: `pnpm lint` and `pnpm typecheck` in `apps/frontend`.
