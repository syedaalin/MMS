import React, { useState } from "react";
import { Plus, Pencil, Shield, Check, X, Lock } from "lucide-react";
import { MODULES, ACTIONS, DEFAULT_ROLES, type Role, type PermissionMap } from "../../lib/usersData";

interface PermCellProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

/**
 * A checkbox element showing permission status for a cell in the permissions grid.
 *
 * @param props - PermCell options.
 * @returns The permission checkbox element.
 */
function PermCell({ checked, onChange, disabled = false }: PermCellProps): JSX.Element {
  return (
    <button onClick={() => !disabled && onChange(!checked)} disabled={disabled}
      className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all mx-auto ${
        checked ? "bg-primary border-primary text-primary-foreground" : "border-border bg-card text-transparent hover:border-primary/50"
      } ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}>
      <Check className="w-3.5 h-3.5" />
    </button>
  );
}

interface RoleFormProps {
  role?: Role | null;
  onSave: (role: Role) => void;
  onCancel: () => void;
}

/**
 * Interactive form to create or edit a custom role with customizable module permissions.
 *
 * @param props - RoleForm options.
 * @returns The role editor form.
 */
function RoleForm({ role, onSave, onCancel }: RoleFormProps): JSX.Element {
  const [name, setName]         = useState(role?.name || "");
  const [desc, setDesc]         = useState(role?.description || "");
  const [perms, setPerms]       = useState<PermissionMap>(role?.permissions ? JSON.parse(JSON.stringify(role.permissions)) : {});
  const [error, setError]       = useState("");

  const togglePerm = (moduleId: string, action: typeof ACTIONS[number]): void => {
    setPerms((prev) => {
      const cur = prev[moduleId] || [];
      const next = cur.includes(action) ? cur.filter((a) => a !== action) : [...cur, action];
      return { ...prev, [moduleId]: next };
    });
  };

  const selectAll = (moduleId: string): void => {
    setPerms((prev) => ({ ...prev, [moduleId]: [...ACTIONS] }));
  };

  const clearAll = (moduleId: string): void => {
    setPerms((prev) => ({ ...prev, [moduleId]: [] }));
  };

  const handleSave = (): void => {
    if (!name.trim()) { setError("Role name is required."); return; }
    onSave({
      id: role?.id || `role_${Date.now()}`,
      name,
      description: desc,
      permissions: perms,
      isSystem: false,
      color: "bg-purple-100 text-purple-700 border-purple-200",
    });
  };

  return (
    <div className="space-y-5">
      {error && <p className="text-xs text-red-600 font-semibold">{error}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-foreground block mb-1">Role Name *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Librarian"
            className="w-full text-sm rounded-xl border border-border bg-background px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <div>
          <label className="text-xs font-semibold text-foreground block mb-1">Description</label>
          <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Brief description…"
            className="w-full text-sm rounded-xl border border-border bg-background px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
      </div>

      {/* Permissions matrix */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 border-b border-border">
              <tr>
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase min-w-[140px]">Module</th>
                {ACTIONS.map((a) => (
                  <th key={a} className="px-2 py-2.5 text-center text-[11px] font-semibold text-muted-foreground uppercase w-16 capitalize">{a}</th>
                ))}
                <th className="px-2 py-2.5 text-center text-[11px] font-semibold text-muted-foreground uppercase">All</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {MODULES.map((m) => {
                const cur = perms[m.id] || [];
                const allChecked = ACTIONS.every((a) => cur.includes(a));
                return (
                  <tr key={m.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-3 py-2.5 text-xs font-semibold text-foreground">{m.label}</td>
                    {ACTIONS.map((a) => (
                      <td key={a} className="px-2 py-2.5">
                        <PermCell
                          checked={cur.includes(a)}
                          onChange={() => togglePerm(m.id, a)}
                        />
                      </td>
                    ))}
                    <td className="px-2 py-2.5">
                      <button onClick={() => allChecked ? clearAll(m.id) : selectAll(m.id)}
                        className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center mx-auto text-xs font-bold transition-all ${
                          allChecked ? "border-amber-400 bg-amber-100 text-amber-700 hover:bg-amber-200" : "border-primary/30 text-primary/60 hover:bg-primary/10"
                        }`}>
                        {allChecked ? <X className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={onCancel} className="px-5 py-2.5 rounded-xl border border-border bg-card text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
        <button onClick={handleSave} className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">Save Role</button>
      </div>
    </div>
  );
}

export interface RolesPermissionsProps {
  adminRole: string;
}

/**
 * RolesPermissions component provides a tab/panel to manage roles and their security matrix.
 *
 * @param props - Component parameters.
 * @returns The roles and permissions management element.
 */
export default function RolesPermissions({ adminRole }: RolesPermissionsProps): JSX.Element {
  const [roles, setRoles]   = useState<Role[]>(DEFAULT_ROLES);
  const [editing, setEdit]  = useState<Role | "new" | null>(null);
  const [selected, setSel]  = useState<Role | null>(null);

  const displayRole = selected || roles[0];

  const handleSave = (role: Role): void => {
    setRoles((prev) => {
      const exists = prev.find((r) => r.id === role.id);
      return exists ? prev.map((r) => r.id === role.id ? role : r) : [...prev, role];
    });
    setEdit(null);
  };

  if (editing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setEdit(null)} className="text-xs text-primary font-semibold hover:underline">← Roles</button>
          <span className="text-xs text-muted-foreground">/</span>
          <span className="text-xs font-semibold text-foreground">{editing === "new" ? "New Role" : `Edit: ${editing.name}`}</span>
        </div>
        <h3 className="text-base font-bold text-foreground">{editing === "new" ? "Create Custom Role" : `Edit Role: ${editing.name}`}</h3>
        <RoleForm role={editing === "new" ? null : editing} onSave={handleSave} onCancel={() => setEdit(null)} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Role list */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-foreground">Roles</p>
            {adminRole === "admin" && (
              <button onClick={() => setEdit("new")}
                className="flex items-center gap-1 text-xs text-primary font-semibold hover:underline">
                <Plus className="w-3 h-3" /> Add Role
              </button>
            )}
          </div>
          {roles.length === 0 && (
            <div className="text-center py-8 rounded-xl border border-dashed border-border text-sm text-muted-foreground">No roles defined</div>
          )}
          {roles.map((r) => (
            <button key={r.id} onClick={() => setSel(r)}
              className={`w-full text-left p-3 rounded-xl border-2 transition-all ${displayRole?.id === r.id ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"}`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-bold text-foreground">{r.name}</p>
                    {r.isSystem && (
                      <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-muted text-muted-foreground">SYSTEM</span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{r.description}</p>
                </div>
                {!r.isSystem && adminRole === "admin" && (
                  <button onClick={(e) => { e.stopPropagation(); setEdit(r); }}
                    className="p-1 rounded text-muted-foreground hover:text-primary transition-colors">
                    <Pencil className="w-3 h-3" />
                  </button>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Permissions matrix (read-only) */}
        <div className="lg:col-span-2 space-y-3">
          {displayRole && (
            <>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                <p className="text-sm font-bold text-foreground">{displayRole.name} — Permissions Matrix</p>
                {displayRole.isSystem && <Lock className="w-3 h-3 text-muted-foreground" />}
              </div>
              <div className="rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/60 border-b border-border">
                      <tr>
                        <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase min-w-[140px]">Module</th>
                        {ACTIONS.map((a) => (
                          <th key={a} className="px-2 py-2.5 text-center text-[11px] font-semibold text-muted-foreground uppercase w-16 capitalize">{a}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {MODULES.map((m) => {
                        const perms = displayRole.permissions[m.id] || [];
                        const hasAny = perms.length > 0;
                        return (
                          <tr key={m.id} className={`transition-colors ${hasAny ? "hover:bg-muted/10" : "opacity-40"}`}>
                            <td className="px-3 py-2.5 text-xs font-semibold text-foreground">{m.label}</td>
                            {ACTIONS.map((a) => (
                              <td key={a} className="px-2 py-2.5">
                                <div className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center mx-auto ${
                                  perms.includes(a) ? "bg-primary border-primary text-primary-foreground" : "border-border bg-card text-transparent"
                                }`}>
                                  <Check className="w-3.5 h-3.5" />
                                </div>
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
