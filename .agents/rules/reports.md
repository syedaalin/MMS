---
trigger: keyword
keywords: [report, reporting, export, analytics, KPI, chart, recharts, excel, pdf, query builder]
description: Reporting conventions for MMS modules
---

# Reporting Directives
- Embed inside modules — no standalone report pages.
- UI tiers: Operations | Analytics | Configuration.
- Live DB bindings only. Zero snapshots or batching.
- Module-aware: auto-hide irrelevant filters per module.
- Ad-hoc builder: drag-drop columns/aggregates (Sum/Avg/Count), 20-row preview.
- `ReportExportBar`: CSS print hides UI chrome. SheetJS for Excel. jsPDF/autoTable with auto A3/A4/Legal × Portrait/Landscape.
- Style: Glassmorphism, Recharts animations, semantic colors (Active, Overdue, Paid).