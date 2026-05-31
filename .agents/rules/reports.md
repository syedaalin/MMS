---
trigger: always_on
description: when creating or reviewing reports use this
---

# Reporting Engine Directives
1. ARCHITECTURE: No standalone report pages. Embed reporting into all modules (Contacts, Students, Attendance, Finance, Sessions, Hasanat, Accounting, Users). Enforce 3-tier UI: Operations | Analytics | Configuration.
2. DATA: 100% real-time. Zero batching/snapshots. Bind charts to live DB streams. UI state mutates instantly on DB writes.
3. CONTEXT UI: Module-aware analytics. Render KPI strips with trend velocity. Auto-hide irrelevant filters natively (e.g., no finance filters in Attendance). Enable parallel dataset benchmarking.
4. BUILDER: Universal ad-hoc query constructor. Expose full schema. Drag-drop columns, group, aggregate (Sum/Avg/Count). Auto-fetch 20 records for live visual preview.
5. EXPORTS: Unified `ReportExportBar`. Print: CSS hides UI. Excel: SheetJS raw dump. PDF: jsPDF/autoTable, auto-scaling, dynamic orientation (Portrait/Landscape), A3/A4/Legal support.
6. DESIGN: 2026 Glassmorphism. Recharts for fluid animations. Enforce strict, universal semantic colour taxonomy (e.g., Active, Overdue, Paid).