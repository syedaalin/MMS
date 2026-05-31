import React, { useState } from "react";
import { X, Save, User } from "lucide-react";
import { motion } from "framer-motion";
import { DEFAULT_ROLES, STATUS_OPTIONS, type SystemUser } from "../../lib/usersData";

export interface EditUserModalProps {
  user: SystemUser;
  onClose: () => void;
  onSave: (user: SystemUser) => void;
}

interface EditUserFormState {
  name: string;
  email: string;
  phone: string;
  roles: string[];
  status: SystemUser["status"];
  twoFactorEnabled: boolean;
}

/**
 * EditUserModal component displays a dialog to edit an existing user's details.
 *
 * @param props - EditUserModal properties.
 * @returns The edit modal element.
 */
export default function EditUserModal({ user, onClose, onSave }: EditUserModalProps): JSX.Element {
  const [form, setForm] = useState<EditUserFormState>({
    name:   user.name,
    email:  user.email,
    phone:  user.phone || "",
    roles:  [...(user.roles || [])],
    status: user.status,
    twoFactorEnabled: user.twoFactorEnabled,
  });
  const [error, setError] = useState("");

  const set = <K extends keyof EditUserFormState>(k: K, v: EditUserFormState[K]): void => {
    setForm((f) => ({ ...f, [k]: v }));
  };

  const toggleRole = (id: string): void => {
    set("roles", form.roles.includes(id) ? form.roles.filter((r) => r !== id) : [...form.roles, id]);
  };

  const handleSave = (): void => {
    if (!form.name.trim()) { setError("Name is required."); return; }
    if (!form.email.trim()) { setError("Email is required."); return; }
    if (form.roles.length === 0) { setError("Assign at least one role."); return; }
    onSave({
      ...user,
      ...form,
      avatarInitials: form.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase(),
    });
    onClose();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-background rounded-2xl border border-border shadow-xl w-full max-w-md p-6 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            <p className="text-base font-bold text-foreground">Edit User</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && <p className="text-xs text-red-600 font-semibold px-1">{error}</p>}

        <div className="space-y-4">
          {/* Name + Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">Full Name *</label>
              <input value={form.name} onChange={(e) => set("name", e.target.value)}
                placeholder="Full name"
                className="w-full text-sm rounded-xl border border-border bg-background px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">Phone</label>
              <input value={form.phone} onChange={(e) => set("phone", e.target.value)}
                placeholder="+92 300 …"
                className="w-full text-sm rounded-xl border border-border bg-background px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">Email Address *</label>
            <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)}
              placeholder="user@madrasa.com"
              className="w-full text-sm rounded-xl border border-border bg-background px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>

          {/* Roles */}
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1.5">Assigned Roles *</label>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_ROLES.map((r) => (
                <button type="button" key={r.id} onClick={() => toggleRole(r.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    form.roles.includes(r.id)
                      ? `${r.color} ring-2 ring-primary/20`
                      : "border-border bg-card text-muted-foreground hover:bg-muted"
                  }`}>
                  {r.name}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">Status</label>
            <select value={form.status} onChange={(e) => set("status", e.target.value as SystemUser["status"])}
              className="w-full text-sm rounded-xl border border-border bg-background px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20">
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>

          {/* 2FA */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.twoFactorEnabled}
              onChange={(e) => set("twoFactorEnabled", e.target.checked)} className="rounded" />
            <span className="text-xs font-medium text-foreground">Two-Factor Authentication enabled</span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-border bg-card text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors">
            Cancel
          </button>
          <button onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5">
            <Save className="w-3.5 h-3.5" /> Save Changes
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
