import React, { useState, useMemo } from "react";
import { Search, ChevronLeft, ChevronRight, Activity } from "lucide-react";
import { SAMPLE_ACTIVITY_LOGS, ACTION_COLORS, ACTION_TYPES, SAMPLE_USERS, type ActivityLog } from "../../lib/usersData";

const PAGE_SIZE = 15;

/**
 * Formats an ISO timestamp to local date and time string.
 *
 * @param ts - ISO date string.
 * @returns Formatted date and time.
 */
function fmtTs(ts: string): string {
  return new Date(ts).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" });
}

export interface ActivityLogsProps {
  logs?: ActivityLog[];
}

/**
 * Renders activity logs with search, user/action filters, date range, and pagination.
 *
 * @param props - Activity logs component properties.
 * @returns The activity logs manager UI.
 */
export default function ActivityLogs({ logs: externalLogs }: ActivityLogsProps): JSX.Element {
  const logs = externalLogs || SAMPLE_ACTIVITY_LOGS;

  const [search, setSearch]     = useState("");
  const [userFilter, setUser]   = useState("all");
  const [actionFilter, setAct]  = useState("all");
  const [dateFrom, setFrom]     = useState("");
  const [dateTo, setTo]         = useState("");
  const [page, setPage]         = useState(1);

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      if (userFilter !== "all" && l.userId !== userFilter) return false;
      if (actionFilter !== "all" && l.action !== actionFilter) return false;
      if (dateFrom && l.ts < dateFrom) return false;
      if (dateTo && l.ts > dateTo + "T23:59:59") return false;
      if (search) {
        const q = search.toLowerCase();
        if (!l.userName.toLowerCase().includes(q) && !l.detail.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [logs, search, userFilter, actionFilter, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const actionColor = (a: keyof typeof ACTION_COLORS): string => ACTION_COLORS[a] || "bg-muted text-muted-foreground";

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative min-w-[180px] flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search user or action…"
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <select value={userFilter} onChange={(e) => { setUser(e.target.value); setPage(1); }}
          className="text-sm rounded-xl border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20">
          <option value="all">All Users</option>
          {SAMPLE_USERS.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <select value={actionFilter} onChange={(e) => { setAct(e.target.value); setPage(1); }}
          className="text-sm rounded-xl border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20">
          <option value="all">All Actions</option>
          {ACTION_TYPES.map((a) => <option key={a} value={a}>{a.replace("_", " ")}</option>)}
        </select>
        <input type="date" value={dateFrom} onChange={(e) => { setFrom(e.target.value); setPage(1); }}
          className="text-sm rounded-xl border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20" />
        <input type="date" value={dateTo} onChange={(e) => { setTo(e.target.value); setPage(1); }}
          className="text-sm rounded-xl border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20" />
      </div>

      {/* Log table */}
      {paginated.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-xl border border-border bg-card text-center">
          <Activity className="w-10 h-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm font-semibold text-foreground">No activity logs found</p>
          <p className="text-xs text-muted-foreground mt-1">Try adjusting filters or date range.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 border-b border-border">
                <tr>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">Timestamp</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">User</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">Action</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">Module</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">Details</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginated.map((l) => (
                  <tr key={l.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-3 py-2.5 font-mono text-[11px] text-muted-foreground whitespace-nowrap">{fmtTs(l.ts)}</td>
                    <td className="px-3 py-2.5">
                      <p className="text-xs font-semibold text-foreground whitespace-nowrap">{l.userName}</p>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${actionColor(l.action)}`}>
                        {l.action.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground capitalize">{l.module}</td>
                    <td className="px-3 py-2.5 text-xs text-foreground max-w-[260px] truncate">{l.detail}</td>
                    <td className="px-3 py-2.5 font-mono text-[11px] text-muted-foreground">{l.ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{filtered.length} log{filtered.length !== 1 ? "s" : ""} · Page {page} of {totalPages}</span>
        <div className="flex items-center gap-1">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-40 transition-colors">
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-40 transition-colors">
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
