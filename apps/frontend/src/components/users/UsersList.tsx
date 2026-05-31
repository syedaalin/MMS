import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, UserPlus, Eye, Pencil, KeyRound,
  CheckCircle2, XCircle,
  Power,
} from "lucide-react";
import { STATUS_COLORS, DEFAULT_ROLES, type SystemUser } from "../../lib/usersData";

interface AvatarProps {
  user: SystemUser;
}

/**
 * Renders user avatar initials inside a stylized circle.
 *
 * @param props - Avatar properties.
 * @returns The avatar element.
 */
function Avatar({ user }: AvatarProps): JSX.Element {
  return (
    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
      <span className="text-xs font-bold text-primary">{user.avatarInitials}</span>
    </div>
  );
}

interface RoleBadgeProps {
  roleId: string;
}

/**
 * Renders a color-coded badge for a user role.
 *
 * @param props - Role badge properties.
 * @returns The role badge element.
 */
function RoleBadge({ roleId }: RoleBadgeProps): JSX.Element {
  const role = DEFAULT_ROLES.find((r) => r.id === roleId);
  if (!role) return <span className="text-xs text-muted-foreground">{roleId}</span>;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${role.color}`}>
      {role.name}
    </span>
  );
}

interface StatusBadgeProps {
  status: SystemUser["status"];
}

/**
 * Renders a color-coded status badge (Active, Inactive, Suspended).
 *
 * @param props - Status badge properties.
 * @returns The status badge element.
 */
function StatusBadge({ status }: StatusBadgeProps): JSX.Element {
  const color = STATUS_COLORS[status] || "bg-muted text-muted-foreground border-border";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${color} capitalize`}>
      {status}
    </span>
  );
}

/**
 * Formats a ISO date string into a user-friendly timestamp.
 *
 * @param ts - ISO date string or timestamp.
 * @returns Formatted date/time string.
 */
function fmtDate(ts: string): string {
  if (!ts) return "Never";
  const d = new Date(ts);
  return d.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }) +
    " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export interface UsersListProps {
  users: SystemUser[];
  role: string;
  onView: (user: SystemUser) => void;
  onEdit: (user: SystemUser) => void;
  onToggleStatus: (id: string, status: "active" | "inactive") => void;
  onResetPassword: (user: SystemUser) => void;
  onInvite: () => void;
  onAddUser: () => void;
}

/**
 * UsersList component displays a table of system users with filtering and management controls.
 *
 * @param props - Users list properties.
 * @returns The users list table and tools.
 */
export default function UsersList({
  users,
  role,
  onView,
  onEdit,
  onToggleStatus,
  onResetPassword,
  onInvite,
  onAddUser,
}: UsersListProps): JSX.Element {
  const [search, setSearch]       = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatus] = useState("all");
  const [selected, setSelected]   = useState<string[]>([]);

  const filtered = useMemo(() => users.filter((u) => {
    if (roleFilter !== "all" && !u.roles.includes(roleFilter)) return false;
    if (statusFilter !== "all" && u.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [users, search, roleFilter, statusFilter]);

  const toggleSelect = (id: string): void => setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  const toggleAll    = (): void => setSelected(selected.length === filtered.length ? [] : filtered.map((u) => u.id));

  const bulkAction = (action: "activate" | "deactivate"): void => {
    selected.forEach((id) => {
      const u = users.find((x) => x.id === id);
      if (u) onToggleStatus(id, action === "activate" ? "active" : "inactive");
    });
    setSelected([]);
  };

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email…"
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
          className="text-sm rounded-xl border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20">
          <option value="all">All Roles</option>
          {DEFAULT_ROLES.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatus(e.target.value)}
          className="text-sm rounded-xl border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20">
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>
        {role === "admin" && (
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={onInvite}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors">
              <UserPlus className="w-3.5 h-3.5" /> Invite
            </button>
            <button onClick={onAddUser}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
              <UserPlus className="w-3.5 h-3.5" /> + Add User
            </button>
          </div>
        )}
      </div>

      {/* Bulk action bar */}
      <AnimatePresence>
        {selected.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-primary/5 border border-primary/20">
            <span className="text-sm font-semibold text-foreground">{selected.length} selected</span>
            <div className="flex gap-2">
              <button onClick={() => bulkAction("activate")}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-bold hover:bg-emerald-200 transition-colors">
                <CheckCircle2 className="w-3 h-3" /> Activate
              </button>
              <button onClick={() => bulkAction("deactivate")}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-xs font-bold hover:bg-border transition-colors">
                <XCircle className="w-3 h-3" /> Deactivate
              </button>
              <button onClick={() => setSelected([])} className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2">Clear</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-xl border border-border bg-card text-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <UserPlus className="w-7 h-7 text-primary/50" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">No users found</p>
            <p className="text-xs text-muted-foreground mt-1">
              {search || roleFilter !== "all" || statusFilter !== "all"
                ? "Try adjusting your search or filters."
                : "Invite teachers, staff, or admins to collaborate."}
            </p>
          </div>
          {role === "admin" && !search && roleFilter === "all" && statusFilter === "all" && (
            <button onClick={onAddUser}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
              <UserPlus className="w-3.5 h-3.5" /> Add First User
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 border-b border-border">
                <tr>
                  {role === "admin" && (
                    <th className="px-3 py-2.5 w-8">
                      <input type="checkbox" checked={selected.length === filtered.length && filtered.length > 0}
                        onChange={toggleAll} className="rounded" />
                    </th>
                  )}
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">User</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">Roles</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">Status</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">Last Login</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">Created</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">2FA</th>
                  <th className="px-3 py-2.5 text-right text-[11px] font-semibold text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((u) => (
                  <motion.tr key={u.id} layout className="hover:bg-muted/20 transition-colors">
                    {role === "admin" && (
                      <td className="px-3 py-2.5">
                        <input type="checkbox" checked={selected.includes(u.id)}
                          onChange={() => toggleSelect(u.id)} className="rounded" />
                      </td>
                    )}
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar user={u} />
                        <div>
                          <p className="text-sm font-semibold text-foreground whitespace-nowrap">{u.name}</p>
                          <p className="text-[11px] text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {u.roles.map((r) => <RoleBadge key={r} roleId={r} />)}
                      </div>
                    </td>
                    <td className="px-3 py-2.5"><StatusBadge status={u.status} /></td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">{fmtDate(u.lastLogin)}</td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground font-mono whitespace-nowrap">{u.createdDate}</td>
                    <td className="px-3 py-2.5">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${u.twoFactorEnabled ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                        {u.twoFactorEnabled ? "ON" : "OFF"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => onView(u)} title="View"
                          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {role === "admin" && (
                          <>
                            <button onClick={() => onEdit(u)} title="Edit"
                              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => onResetPassword(u)} title="Reset Password"
                              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-amber-600 transition-colors">
                              <KeyRound className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => onToggleStatus(u.id, u.status === "active" ? "inactive" : "active")} title="Toggle Status"
                              className={`p-1.5 rounded-lg hover:bg-muted transition-colors ${u.status === "active" ? "text-muted-foreground hover:text-red-500" : "text-muted-foreground hover:text-emerald-600"}`}>
                              <Power className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">{filtered.length} user{filtered.length !== 1 ? "s" : ""} shown</p>
    </div>
  );
}
