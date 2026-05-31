// ── Roles & Permissions ───────────────────────────────────────────────────────

/** A module available in the application. */
export interface AppModule {
  id: string;
  label: string;
}

export const MODULES: AppModule[] = [
  { id: "dashboard",    label: "Dashboard" },
  { id: "students",     label: "Students" },
  { id: "enrollments",  label: "Enrollments" },
  { id: "sessions",     label: "Sessions" },
  { id: "attendance",   label: "Attendance" },
  { id: "finance",      label: "Finance" },
  { id: "hasanat",      label: "Hasanat Cards" },
  { id: "examinations", label: "Examinations" },
  { id: "reports",      label: "Reports" },
  { id: "users",        label: "Users" },
  { id: "settings",     label: "Settings" },
];

/** CRUD actions that can be granted on a module. */
export type Action = "create" | "read" | "update" | "delete";

export const ACTIONS: Action[] = ["create", "read", "update", "delete"];

/** Map of module id -> list of permitted actions. */
export type PermissionMap = Record<string, Action[]>;

/** A role definition with its permission set. */
export interface Role {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  color: string;
  permissions: PermissionMap;
}

/**
 * Builds a full-access permission map for the provided module ids.
 * @param moduleIds - Array of module id strings.
 * @returns A PermissionMap granting all CRUD actions on each module.
 */
function allPerms(moduleIds: string[]): PermissionMap {
  const p: PermissionMap = {};
  moduleIds.forEach((m) => {
    p[m] = ["create", "read", "update", "delete"];
  });
  return p;
}

export const DEFAULT_ROLES: Role[] = [
  {
    id: "admin",
    name: "Admin",
    description: "Full access to all modules and settings.",
    isSystem: true,
    color: "bg-red-100 text-red-700 border-red-200",
    permissions: allPerms(MODULES.map((m) => m.id)),
  },
  {
    id: "teacher",
    name: "Teacher",
    description: "Access to students, attendance, sessions, and examinations.",
    isSystem: true,
    color: "bg-blue-100 text-blue-700 border-blue-200",
    permissions: {
      dashboard:    ["read"],
      students:     ["read"],
      enrollments:  ["read"],
      sessions:     ["read"],
      attendance:   ["create", "read", "update"],
      examinations: ["create", "read", "update"],
      hasanat:      ["read"],
      reports:      ["read"],
    },
  },
  {
    id: "assistant_teacher",
    name: "Assistant Teacher",
    description: "Attendance marking and limited student view.",
    isSystem: true,
    color: "bg-cyan-100 text-cyan-700 border-cyan-200",
    permissions: {
      dashboard:  ["read"],
      students:   ["read"],
      sessions:   ["read"],
      attendance: ["create", "read"],
      hasanat:    ["read"],
    },
  },
  {
    id: "accountant",
    name: "Accountant",
    description: "Finance and fee management only.",
    isSystem: true,
    color: "bg-amber-100 text-amber-700 border-amber-200",
    permissions: {
      dashboard:   ["read"],
      finance:     ["create", "read", "update"],
      reports:     ["read"],
      students:    ["read"],
      enrollments: ["read"],
    },
  },
];

// ── Users ─────────────────────────────────────────────────────────────────────

/** Possible account statuses for a user. */
export type UserStatus = "active" | "inactive" | "suspended";

/** A system user record. */
export interface SystemUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  roles: string[];
  status: UserStatus;
  twoFactorEnabled: boolean;
  lastLogin: string;
  createdDate: string;
  failedLoginAttempts: number;
  activeSessions: number;
  avatarInitials: string;
}

export const SAMPLE_USERS: SystemUser[] = [
  {
    id: "u1",
    name: "Ahmad Al-Rashid",
    email: "ahmad@madrasa.com",
    phone: "+92 300 1111111",
    roles: ["admin"],
    status: "active",
    twoFactorEnabled: true,
    lastLogin: "2026-04-16T08:32:00",
    createdDate: "2024-01-01",
    failedLoginAttempts: 0,
    activeSessions: 2,
    avatarInitials: "AR",
  },
  {
    id: "u2",
    name: "Sheikh Ibrahim",
    email: "ibrahim@madrasa.com",
    phone: "+92 321 2222222",
    roles: ["teacher"],
    status: "active",
    twoFactorEnabled: false,
    lastLogin: "2026-04-15T07:15:00",
    createdDate: "2024-02-10",
    failedLoginAttempts: 0,
    activeSessions: 1,
    avatarInitials: "SI",
  },
  {
    id: "u3",
    name: "Ustadha Fatima",
    email: "fatima@madrasa.com",
    phone: "+92 312 3333333",
    roles: ["teacher", "assistant_teacher"],
    status: "active",
    twoFactorEnabled: false,
    lastLogin: "2026-04-14T09:00:00",
    createdDate: "2024-03-05",
    failedLoginAttempts: 1,
    activeSessions: 1,
    avatarInitials: "UF",
  },
  {
    id: "u4",
    name: "Hassan Bilal",
    email: "hassan@madrasa.com",
    phone: "+92 333 4444444",
    roles: ["accountant"],
    status: "active",
    twoFactorEnabled: true,
    lastLogin: "2026-04-16T10:00:00",
    createdDate: "2024-04-01",
    failedLoginAttempts: 0,
    activeSessions: 1,
    avatarInitials: "HB",
  },
  {
    id: "u5",
    name: "Mariam Siddiqui",
    email: "mariam@madrasa.com",
    phone: "+92 345 5555555",
    roles: ["assistant_teacher"],
    status: "inactive",
    twoFactorEnabled: false,
    lastLogin: "2025-12-01T08:00:00",
    createdDate: "2024-05-20",
    failedLoginAttempts: 0,
    activeSessions: 0,
    avatarInitials: "MS",
  },
  {
    id: "u6",
    name: "Zubair Khan",
    email: "zubair@madrasa.com",
    phone: "+92 311 6666666",
    roles: ["teacher"],
    status: "suspended",
    twoFactorEnabled: false,
    lastLogin: "2025-10-15T12:00:00",
    createdDate: "2024-06-01",
    failedLoginAttempts: 5,
    activeSessions: 0,
    avatarInitials: "ZK",
  },
];

// ── Activity Logs ─────────────────────────────────────────────────────────────

/** Types of actions recorded in the activity log. */
export type ActivityAction =
  | "login"
  | "login_failed"
  | "create"
  | "update"
  | "delete"
  | "role_change";

/** A single activity log entry. */
export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: ActivityAction;
  module: string;
  detail: string;
  ts: string;
  ip: string;
}

export const SAMPLE_ACTIVITY_LOGS: ActivityLog[] = [
  { id: "log1",  userId: "u1", userName: "Ahmad Al-Rashid", action: "login",        module: "auth",       detail: "Logged in successfully",                       ts: "2026-04-16T08:32:00", ip: "192.168.1.10" },
  { id: "log2",  userId: "u1", userName: "Ahmad Al-Rashid", action: "update",       module: "students",   detail: "Updated student Yusuf Al-Farsi",               ts: "2026-04-16T09:00:00", ip: "192.168.1.10" },
  { id: "log3",  userId: "u4", userName: "Hassan Bilal",    action: "create",       module: "finance",    detail: "Created invoice #inv011",                       ts: "2026-04-16T10:15:00", ip: "192.168.1.22" },
  { id: "log4",  userId: "u2", userName: "Sheikh Ibrahim",  action: "login",        module: "auth",       detail: "Logged in successfully",                       ts: "2026-04-15T07:15:00", ip: "192.168.1.5"  },
  { id: "log5",  userId: "u2", userName: "Sheikh Ibrahim",  action: "create",       module: "attendance", detail: "Marked attendance for Hifz A – 2026-04-15",    ts: "2026-04-15T07:45:00", ip: "192.168.1.5"  },
  { id: "log6",  userId: "u3", userName: "Ustadha Fatima",  action: "login",        module: "auth",       detail: "Logged in successfully",                       ts: "2026-04-14T09:00:00", ip: "192.168.1.8"  },
  { id: "log7",  userId: "u1", userName: "Ahmad Al-Rashid", action: "role_change",  module: "users",      detail: "Assigned role 'Teacher' to Ustadha Fatima",    ts: "2026-04-13T11:00:00", ip: "192.168.1.10" },
  { id: "log8",  userId: "u6", userName: "Zubair Khan",     action: "login_failed", module: "auth",       detail: "Failed login attempt (5th) — account suspended", ts: "2025-10-15T12:00:00", ip: "10.0.0.99"  },
  { id: "log9",  userId: "u1", userName: "Ahmad Al-Rashid", action: "delete",       module: "students",   detail: "Deleted test student record",                  ts: "2026-04-12T14:00:00", ip: "192.168.1.10" },
  { id: "log10", userId: "u4", userName: "Hassan Bilal",    action: "update",       module: "finance",    detail: "Marked invoice #inv003 as paid",               ts: "2026-04-11T16:30:00", ip: "192.168.1.22" },
];

export const ACTION_TYPES: ActivityAction[] = [
  "login",
  "login_failed",
  "create",
  "update",
  "delete",
  "role_change",
];

export const STATUS_OPTIONS: UserStatus[] = ["active", "inactive", "suspended"];

export const STATUS_COLORS: Record<UserStatus, string> = {
  active:    "bg-emerald-100 text-emerald-700 border-emerald-200",
  inactive:  "bg-muted text-muted-foreground border-border",
  suspended: "bg-red-100 text-red-700 border-red-200",
};

export const ACTION_COLORS: Record<ActivityAction, string> = {
  login:        "bg-emerald-50 text-emerald-700",
  login_failed: "bg-red-50 text-red-700",
  create:       "bg-blue-50 text-blue-700",
  update:       "bg-amber-50 text-amber-700",
  delete:       "bg-red-50 text-red-700",
  role_change:  "bg-purple-50 text-purple-700",
};
