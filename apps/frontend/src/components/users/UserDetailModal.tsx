import React from "react";
import { X, Shield, AlertTriangle, CheckCircle2, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { STATUS_COLORS, DEFAULT_ROLES, MODULES, ACTIONS, type SystemUser, type Action } from "../../lib/usersData";

interface RowProps {
  label: string;
  value: React.ReactNode;
}

/**
 * Standard detail layout row with a label and value.
 *
 * @param props - Row parameters.
 * @returns The row element.
 */
function Row({ label, value }: RowProps): JSX.Element {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-border last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-semibold text-foreground text-right">{value || "—"}</span>
    </div>
  );
}

interface SectionProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}

/**
 * Styled subsection header and box card.
 *
 * @param props - Section properties.
 * @returns The section panel element.
 */
function Section({ icon: Icon, title, children }: SectionProps): JSX.Element {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/40 border-b border-border">
        <Icon className="w-3.5 h-3.5 text-primary" />
        <p className="text-xs font-bold text-foreground uppercase tracking-wide">{title}</p>
      </div>
      <div className="px-4">{children}</div>
    </div>
  );
}

/**
 * Helper to format timestamps into user-friendly localized date/time strings.
 *
 * @param ts - ISO date string or timestamp.
 * @returns Localized date string.
 */
function fmtDate(ts: string): string {
  if (!ts) return "Never";
  return new Date(ts).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" });
}

export interface UserDetailModalProps {
  user: SystemUser | null;
  onClose: () => void;
  role: string;
}

/**
 * UserDetailModal component displays a detailed view of a user's status, roles,
 * permissions, and security logs.
 *
 * @param props - UserDetailModal properties.
 * @returns The user details modal element.
 */
export default function UserDetailModal({ user, onClose, role: viewerRole }: UserDetailModalProps): JSX.Element | null {
  if (!user) return null;

  const userRoles = DEFAULT_ROLES.filter((r) => user.roles?.includes(r.id));

  // Compute effective permissions (union of all roles)
  const effectivePerms: Record<string, Action[]> = {};
  MODULES.forEach((m) => {
    const permsSet = new Set<Action>();
    userRoles.forEach((r) => {
      (r.permissions[m.id] || []).forEach((a) => permsSet.add(a));
    });
    effectivePerms[m.id] = [...permsSet];
  });

  const statusColor = STATUS_COLORS[user.status] || "";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 p-4 pt-8 overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-background rounded-2xl border border-border shadow-xl w-full max-w-lg space-y-4 p-5 mb-10">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-lg font-bold text-primary">{user.avatarInitials}</span>
          </div>
          <div className="flex-1">
            <p className="text-base font-bold text-foreground">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold border ${statusColor} capitalize`}>{user.status}</span>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Basic info */}
        <Section icon={Shield} title="Basic Info">
          <Row label="Full Name"    value={user.name} />
          <Row label="Email"        value={user.email} />
          <Row label="Phone"        value={user.phone} />
          <Row label="Member Since" value={user.createdDate} />
          <Row label="Last Login"   value={fmtDate(user.lastLogin)} />
          <Row label="Active Sessions" value={user.activeSessions} />
        </Section>

        {/* Roles */}
        <Section icon={Shield} title="Assigned Roles">
          <div className="py-3 flex flex-wrap gap-2">
            {userRoles.length === 0 ? (
              <p className="text-xs text-muted-foreground">No roles assigned</p>
            ) : userRoles.map((r) => (
              <div key={r.id} className={`flex flex-col gap-0.5 px-3 py-1.5 rounded-xl border ${r.color}`}>
                <p className="text-xs font-bold">{r.name}</p>
                <p className="text-[10px]">{r.description}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Permissions summary */}
        <Section icon={CheckCircle2} title="Effective Permissions">
          <div className="py-3 space-y-1.5">
            {MODULES.map((m) => {
              const perms = effectivePerms[m.id] || [];
              if (perms.length === 0) return null;
              return (
                <div key={m.id} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-28 flex-shrink-0">{m.label}</span>
                  <div className="flex gap-1 flex-wrap">
                    {ACTIONS.map((a) => (
                      <span key={a} className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full capitalize ${
                        perms.includes(a) ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground/40"
                      }`}>{a}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        {/* Security */}
        <Section icon={Lock} title="Security">
          <Row label="2FA Enabled" value={
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${user.twoFactorEnabled ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
              {user.twoFactorEnabled ? "Enabled" : "Disabled"}
            </span>
          } />
          <Row label="Failed Login Attempts" value={
            <span className={user.failedLoginAttempts >= 3 ? "text-red-600 font-bold" : ""}>{user.failedLoginAttempts}</span>
          } />
          {user.failedLoginAttempts >= 5 && (
            <div className="flex items-center gap-2 py-2 text-red-600 text-xs font-semibold">
              <AlertTriangle className="w-3.5 h-3.5" /> Account locked due to repeated failed attempts
            </div>
          )}
        </Section>
      </motion.div>
    </motion.div>
  );
}
