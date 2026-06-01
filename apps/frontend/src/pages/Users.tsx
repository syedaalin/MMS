import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserCog, Users as UsersIcon, Shield, Activity, Settings, LayoutDashboard, BarChart2 } from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import UsersList from "../components/users/UsersList";
import UserDetailModal from "../components/users/UserDetailModal";
import InviteUserModal from "../components/users/InviteUserModal";
import EditUserModal from "../components/users/EditUserModal";
import AddUserModal from "../components/users/AddUserModal";
import RolesPermissions from "../components/users/RolesPermissions";
import UsersSettingsPanel from "../components/users/UsersSettingsPanel";
import ActivityLogs from "../components/users/ActivityLogs";
import ModuleReports from "../components/reports/ModuleReports";
import KPISummary from "../components/reports/KPISummary";
import { SAMPLE_USERS, SAMPLE_ACTIVITY_LOGS, SystemUser, ActivityLog, UserStatus } from "../lib/usersData";
import { getCollection, saveCollection } from "../lib/db";

const ROLE_OPTIONS = ["admin", "teacher", "accountant"];

const PAGE_TABS = [
  { id: "operations",    label: "Operations",    icon: LayoutDashboard },
  { id: "analytics",     label: "Analytics",     icon: BarChart2 },
  { id: "configuration", label: "Configuration", icon: Settings },
];

const SUB_TABS = [
  { id: "users",    label: "Users List",   icon: UsersIcon },
  { id: "activity", label: "Activity Logs", icon: Activity },
];

/**
 * Users and user roles management component.
 * Allows managing user accounts, permissions, and viewing activity logs.
 * 
 * @returns {React.ReactElement} The Users page component.
 */
export default function Users() {
  const [activeTab, setActiveTab] = useState("operations");
  const [activeSubTab, setActiveSubTab] = useState("users");
  const [configSubTab, setConfigSubTab] = useState<"permissions" | "fields" | "preferences">("permissions");
  const [viewerRole, setViewerRole] = useState("admin");
  const [users, setUsers]           = useState<SystemUser[]>(() => getCollection("users", SAMPLE_USERS));
  const [logs, setLogs]             = useState<ActivityLog[]>(() => getCollection("user_activity_logs", SAMPLE_ACTIVITY_LOGS));

  useEffect(() => {
    saveCollection("users", users);
  }, [users]);

  useEffect(() => {
    saveCollection("user_activity_logs", logs);
  }, [logs]);

  // Reset tab to operations if active role changes and settings/analytics tab is no longer permitted
  useEffect(() => {
    if (viewerRole !== "admin" && (activeTab === "configuration" || activeTab === "analytics")) {
      setActiveTab("operations");
    }
  }, [viewerRole, activeTab]);

  const [viewing, setViewing]       = useState<SystemUser | null>(null);
  const [editing, setEditing]       = useState<SystemUser | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);

  // Stats
  const active    = users.filter((u) => u.status === "active").length;
  const inactive  = users.filter((u) => u.status === "inactive").length;
  const suspended = users.filter((u) => u.status === "suspended").length;

  const handleToggleStatus = (id: string, newStatus: UserStatus) => {
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, status: newStatus } : u));
    addLog({ action: "update", module: "users", detail: `User ${id} status set to ${newStatus}` });
  };

  const handleResetPassword = (user: SystemUser) => {
    addLog({ userId: "u1", userName: "Admin", action: "update", module: "users", detail: `Password reset triggered for ${user.name}`, ip: "local" });
    alert(`Password reset email sent to ${user.email}`);
  };

  const handleSaveEdit = (updated: SystemUser) => {
    setUsers((prev) => prev.map((u) => u.id === updated.id ? updated : u));
    addLog({ action: "update", module: "users", detail: `Updated user profile: ${updated.name}` });
  };

  const handleInvite = (user: SystemUser) => {
    setUsers((prev) => [user, ...prev]);
    addLog({ userId: "u1", userName: "Admin", action: "create", module: "users", detail: `Invited new user ${user.name} (${user.email})`, ip: "local" });
  };

  const handleAddUser = (user: SystemUser) => {
    setUsers((prev) => [user, ...prev]);
    addLog({ action: "create", module: "users", detail: `Created new user ${user.name} (${user.email}) with roles: ${user.roles.join(", ")}` });
  };

  const addLog = (entry: Partial<ActivityLog> & { action: string; module: string; detail: string }) => {
    setLogs((prev) => [{
      id: `log${Date.now()}`,
      userId: entry.userId || "u1",
      userName: entry.userName || "Admin",
      action: entry.action,
      module: entry.module,
      detail: entry.detail,
      ts: new Date().toISOString(),
      ip: entry.ip || "192.168.1.10",
    }, ...prev]);
  };

  const visibleTopTabs = PAGE_TABS.filter((t) => {
    if (t.id === "configuration" || t.id === "analytics") return viewerRole === "admin";
    return true;
  });

  const effectiveTab = visibleTopTabs.find((t) => t.id === activeTab) ? activeTab : "operations";
  const effectiveSubTab = SUB_TABS.find((t) => t.id === activeSubTab) ? activeSubTab : "users";

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <title>MMS - User Management</title>
      <meta name="description" content="Configure admin and staff users, update roles and access permissions, and track active security logs." />
      <PageHeader
        icon={UserCog}
        title="User Management"
        subtitle="Manage users, roles, permissions, and access control"
        actions={
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-border overflow-hidden text-[11px] font-bold">
              {ROLE_OPTIONS.map((r) => (
                <button key={r} onClick={() => setViewerRole(r)}
                  className={`px-3 py-2 capitalize transition-colors ${viewerRole === r ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted"}`}>
                  {r}
                </button>
              ))}
            </div>
          </div>
        }
      />

      <div className="space-y-4">
        <KPISummary category="faculty" role={viewerRole} />
      </div>

      {/* Primary Tabs */}
      {visibleTopTabs.length > 1 && (
        <div className="flex border-b border-border overflow-x-auto">
          {visibleTopTabs.map((t) => {
            const Icon   = t.icon;
            const active = effectiveTab === t.id;
            return (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-[13px] font-semibold whitespace-nowrap border-b-2 transition-all ${
                  active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}>
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Sub-tabs for Operations */}
      {effectiveTab === "operations" && (
        <div className="flex gap-1.5 p-1 bg-muted/60 rounded-xl w-fit border border-border/30 overflow-x-auto max-w-full">
          {SUB_TABS.map((t) => {
            const active = effectiveSubTab === t.id;
            return (
              <button key={t.id} onClick={() => setActiveSubTab(t.id)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}>
                {t.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div key={effectiveTab + "-" + effectiveSubTab}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
          className="space-y-4">

          {effectiveTab === "analytics" && <ModuleReports category="faculty" role={viewerRole} />}
          {effectiveTab === "configuration" && (
            <div className="space-y-4">
              <div className="flex gap-1 p-1 bg-muted rounded-xl w-fit border border-border/30">
                <button
                  type="button"
                  onClick={() => setConfigSubTab("permissions")}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    configSubTab === "permissions" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Permissions
                </button>
                <button
                  type="button"
                  onClick={() => setConfigSubTab("fields")}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    configSubTab === "fields" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Fields
                </button>
                <button
                  type="button"
                  onClick={() => setConfigSubTab("preferences")}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    configSubTab === "preferences" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Preferences
                </button>
              </div>
              {configSubTab === "permissions" && <RolesPermissions adminRole={viewerRole} />}
              {configSubTab === "fields" && <UsersSettingsPanel mode="fields" />}
              {configSubTab === "preferences" && <UsersSettingsPanel mode="preferences" />}
            </div>
          )}

          {effectiveTab === "operations" && effectiveSubTab === "users" && (
            <UsersList
              users={users}
              role={viewerRole}
              onView={setViewing}
              onEdit={setEditing}
              onToggleStatus={handleToggleStatus}
              onResetPassword={handleResetPassword}
              onInvite={() => setShowInvite(true)}
              onAddUser={() => setShowAddUser(true)}
            />
          )}

          {effectiveTab === "operations" && effectiveSubTab === "activity" && <ActivityLogs logs={logs} />}
        </motion.div>
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {viewing && (
          <UserDetailModal user={viewing} role={viewerRole} onClose={() => setViewing(null)} />
        )}
        {editing && (
          <EditUserModal user={editing} onClose={() => setEditing(null)} onSave={handleSaveEdit} />
        )}
        {showAddUser && (
          <AddUserModal
            onClose={() => setShowAddUser(false)}
            onAdd={handleAddUser}
            existingEmails={users.map((u) => u.email.toLowerCase()) as never[]}
          />
        )}
        {showInvite && (
          <InviteUserModal onClose={() => setShowInvite(false)} onInvite={handleInvite} />
        )}
      </AnimatePresence>
    </div>
  );
}