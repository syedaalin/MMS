import React, { useState } from "react";
import { X, UserPlus, Mail, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { DEFAULT_ROLES, type SystemUser } from "../../lib/usersData";

export interface InviteUserModalProps {
  onClose: () => void;
  onInvite: (user: SystemUser) => void;
}

interface InviteFormState {
  name: string;
  email: string;
  phone: string;
  roles: string[];
  status: SystemUser["status"];
  sendEmail: boolean;
}

/**
 * InviteUserModal component displays a dialog to invite a new user by name and email.
 *
 * @param props - InviteUserModal properties.
 * @returns The invite modal element.
 */
export default function InviteUserModal({ onClose, onInvite }: InviteUserModalProps): JSX.Element {
  const [form, setForm]     = useState<InviteFormState>({ name: "", email: "", phone: "", roles: [], status: "active", sendEmail: true });
  const [done, setDone]     = useState(false);
  const [error, setError]   = useState("");

  const set = <K extends keyof InviteFormState>(k: K, v: InviteFormState[K]): void => {
    setForm((f) => ({ ...f, [k]: v }));
  };

  const toggleRole = (id: string): void => {
    set("roles", form.roles.includes(id) ? form.roles.filter((r) => r !== id) : [...form.roles, id]);
  };

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) { setError("Name and email are required."); return; }
    if (form.roles.length === 0) { setError("Assign at least one role."); return; }
    const user: SystemUser = {
      id: `u${Date.now()}`,
      name: form.name,
      email: form.email,
      phone: form.phone,
      roles: form.roles,
      status: form.status,
      avatarInitials: form.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase(),
      lastLogin: "",
      createdDate: new Date().toISOString().slice(0, 10),
      failedLoginAttempts: 0,
      twoFactorEnabled: false,
      activeSessions: 0,
    };
    setDone(true);
    setTimeout(() => { onInvite(user); onClose(); }, 1500);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-background rounded-2xl border border-border shadow-xl w-full max-w-md p-6 space-y-5">

        {done ? (
          <div className="flex flex-col items-center py-8 text-center gap-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-emerald-600" />
            </div>
            <p className="text-base font-bold text-foreground">Invitation Sent!</p>
            <p className="text-sm text-muted-foreground">{form.email} has been invited.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-primary" />
                <p className="text-base font-bold text-foreground">Invite New User</p>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <p className="text-xs text-red-600 font-semibold px-1">{error}</p>}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Full Name *</label>
                  <input value={form.name} onChange={(e) => set("name", e.target.value)}
                    placeholder="e.g. Hassan Ali"
                    className="w-full text-sm rounded-xl border border-border bg-background px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Phone</label>
                  <input value={form.phone} onChange={(e) => set("phone", e.target.value)}
                    placeholder="+92 300 …"
                    className="w-full text-sm rounded-xl border border-border bg-background px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Email Address *</label>
                <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)}
                  placeholder="user@madrasa.com"
                  className="w-full text-sm rounded-xl border border-border bg-background px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1.5">Assign Roles *</label>
                <div className="flex flex-wrap gap-2">
                  {DEFAULT_ROLES.map((r) => (
                    <button type="button" key={r.id} onClick={() => toggleRole(r.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        form.roles.includes(r.id) ? `${r.color} ring-2 ring-primary/20` : "border-border bg-card text-muted-foreground hover:bg-muted"
                      }`}>
                      {r.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Status</label>
                <select value={form.status} onChange={(e) => set("status", e.target.value as SystemUser["status"])}
                  className="w-full text-sm rounded-xl border border-border bg-background px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.sendEmail} onChange={(e) => set("sendEmail", e.target.checked)} className="rounded" />
                <span className="text-xs font-medium text-foreground flex items-center gap-1">
                  <Mail className="w-3 h-3 text-primary" /> Send invitation email
                </span>
              </label>

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-border bg-card text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors">
                  Cancel
                </button>
                <button type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
                  Send Invite
                </button>
              </div>
            </form>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
