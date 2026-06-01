/**
 * @file settingsTypes.ts
 * @description Canonical TypeScript interfaces and default values for every domain settings
 * object stored in the application's key-value database.
 *
 * Storage key → Interface mapping:
 *   "global_settings"       → GlobalSettings
 *   "attendance_settings"   → AttendanceModuleSettings
 *   "finance_settings"      → FinanceSettings
 *   "examinations_settings" → ExaminationsSettings
 *   "sessions_settings"     → SessionsSettings
 *   "enrollments_settings"  → EnrollmentsSettings
 *   "students_settings"     → StudentsSettings
 *   "contact_prefs"         → ContactPrefs
 *   "accounting_settings"   → AccountingSettings
 */

// ─── Customizable Form Fields Schema ──────────────────────────────────────────

export interface ModuleFieldConfig {
  enabled: boolean;
  required: boolean;
}

export interface ModuleCustomField {
  id: string;
  label: string;
  type: "text" | "textarea" | "number" | "select" | "boolean" | "date" | "url" | "email" | "tags";
  required?: boolean;
  options?: string[];
  placeholder?: string;
  description?: string;
  defaultValue?: string;
  showInForm?: boolean;
  unique?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  mask?: string;
}

export interface ModuleFieldDef {
  id: string;
  label: string;
  isCustom?: boolean;
  alwaysOn?: boolean;
  type?: string;
  required?: boolean;
  options?: string[];
  enabled?: boolean;
  description?: string;
  placeholder?: string;
  defaultValue?: string;
  unique?: boolean;
  showInForm?: boolean;
}

/**
 * Returns a sorted list of all module field definitions (default & custom)
 * based on the saved display sequence order in settings.
 *
 * @param defaultDefs The default field definitions of the module
 * @param fieldOrder The saved sequence of field IDs
 * @param fieldsConfig The toggled enable/required state for default fields
 * @param customFields Custom fields created by the user
 */
export function getSortedFields(
  defaultDefs: ModuleFieldDef[],
  fieldOrder: string[] | undefined,
  fieldsConfig: Record<string, ModuleFieldConfig> | undefined,
  customFields: ModuleCustomField[] | undefined
): ModuleFieldDef[] {
  const defaults = defaultDefs.map((f) => {
    const cfg = fieldsConfig?.[f.id] || { enabled: true, required: !!f.required };
    return {
      ...f,
      enabled: f.alwaysOn ? true : cfg.enabled,
      required: f.alwaysOn ? !!f.required : cfg.required,
    };
  });

  const customs = (customFields || []).map((f) => ({
    id: f.id,
    label: f.label,
    isCustom: true,
    alwaysOn: false,
    type: f.type,
    required: !!f.required,
    options: f.options,
    placeholder: f.placeholder,
    description: f.description,
    defaultValue: f.defaultValue,
    unique: f.unique,
    showInForm: f.showInForm !== false,
    enabled: true,
  }));

  const all = [...defaults, ...customs];
  const order = fieldOrder || defaultDefs.map((f) => f.id);
  const orderMap = Object.fromEntries(order.map((id, index) => [id, index]));

  return all.sort((a, b) => {
    const ai = orderMap[a.id] ?? 9999;
    const bi = orderMap[b.id] ?? 9999;
    return ai - bi;
  });
}

// ─── Global Settings ──────────────────────────────────────────────────────────

/**
 * System-wide, cross-cutting configuration that applies to the whole application.
 * This is intentionally kept lean — domain-specific flags live in their own settings objects.
 */
export interface GlobalSettings {
  /** UI language code, e.g. "en", "ar". */
  language: string;
  /** IANA timezone string, e.g. "Asia/Karachi". */
  timezone: string;
  /** Display date format token, e.g. "DD/MM/YYYY". */
  dateFormat: string;
  /** Master toggle for email-based notifications. */
  emailNotifications: boolean;
  /** Master toggle for SMS-based notifications. */
  smsNotifications: boolean;
  /** Whether two-factor authentication is enforced. */
  twoFactor: boolean;
  /** Session inactivity timeout in minutes. */
  sessionTimeout: string;
  /** Password policy level: "basic" | "medium" | "strong". */
  passwordPolicy: string;
  /** UI colour theme preference. */
  theme: "light" | "dark" | "system";
  /** Map of module IDs to their enabled status. */
  enabledModules: Record<string, boolean>;
}

/** Definition for an application module. */
export interface ModuleDefinition {
  id: string;
  label: string;
  description: string;
  icon: string;
  category: "core" | "academic" | "admin" | "finance";
  required?: boolean;
}

/** List of all system modules for configuration. */
export const SYSTEM_MODULES: ModuleDefinition[] = [
  { id: "dashboard",   label: "Dashboard",   description: "Central overview and analytics",   icon: "LayoutDashboard", category: "core", required: true },
  { id: "students",    label: "Academics",   description: "Students directory, enrollments, sessions & scheduling", icon: "GraduationCap", category: "core" },
  { id: "contacts",    label: "Contacts",    description: "Comprehensive CRM and personas",   icon: "Users",           category: "core" },
  { id: "attendance",  label: "Attendance",  description: "Tracking and reporting",           icon: "UserCheck",       category: "academic" },
  { id: "examination", label: "Examinations",description: "Testing and grading systems",      icon: "FileText",        category: "academic" },
  { id: "finance",     label: "Finance",     description: "Invoicing and fee management",     icon: "DollarSign",      category: "finance" },
  { id: "accounting",  label: "Accounting",  description: "General ledger and reports",       icon: "Briefcase",       category: "finance" },
  { id: "hasanat",     label: "Hasanat",     description: "Incentive and reward points",      icon: "Star",            category: "admin" },
  { id: "users",       label: "User Access", description: "Role-based permissions",           icon: "Shield",          category: "admin", required: true },
];

/** Authoritative default values for GlobalSettings. */
export const DEFAULT_GLOBAL_SETTINGS: GlobalSettings = {
  language: "en",
  timezone: "Asia/Karachi",
  dateFormat: "DD/MM/YYYY",
  emailNotifications: true,
  smsNotifications: false,
  twoFactor: false,
  sessionTimeout: "60",
  passwordPolicy: "strong",
  theme: "system",
  enabledModules: {
    dashboard: true,
    students: true,
    contacts: true,
    sessions: true,
    enrollment: true,
    attendance: true,
    examination: true,
    finance: true,
    accounting: true,
    hasanat: true,
    users: true,
  },
};

// ─── Attendance Module Settings ───────────────────────────────────────────────

export interface AttendanceModuleSettings {
  workingDays: string[];
  cutoffTime: string;
  lateThresholdMins: number;
  autoAbsentAfterMins: number;
  qrEnabled: boolean;
  lowAttendanceThreshold: number;
  notifyParents: boolean;
  requireNoteForAbsent: boolean;
  lockAfterSubmit: boolean;
  trackHalfDay: boolean;
  weeklyReport: boolean;
  attendanceAlerts: boolean;
  allowManualOverride: boolean;
  offlineEnabled: boolean;
  geoTagging: boolean;
  defaultViewLayout?: string;
  fields?: Record<string, ModuleFieldConfig>;
  customFields?: ModuleCustomField[];
  fieldOrder?: string[];
}

export const DEFAULT_ATTENDANCE_SETTINGS: AttendanceModuleSettings = {
  workingDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
  cutoffTime: "09:30",
  lateThresholdMins: 15,
  autoAbsentAfterMins: 30,
  qrEnabled: false,
  lowAttendanceThreshold: 75,
  notifyParents: true,
  requireNoteForAbsent: true,
  lockAfterSubmit: true,
  trackHalfDay: true,
  weeklyReport: true,
  attendanceAlerts: true,
  allowManualOverride: true,
  offlineEnabled: false,
  geoTagging: false,
  defaultViewLayout: "list",
  fields: {
    status: { enabled: true, required: true },
    timeIn: { enabled: true, required: true },
    timeOut: { enabled: true, required: true },
    notes: { enabled: true, required: false },
  },
  customFields: [],
  fieldOrder: ["status", "timeIn", "timeOut", "notes"],
};

export const DEFAULT_ATTENDANCE_FIELD_DEFS: ModuleFieldDef[] = [
  { id: "status", label: "Attendance Status", alwaysOn: true, required: true },
  { id: "timeIn", label: "Time In" },
  { id: "timeOut", label: "Time Out" },
  { id: "notes", label: "Notes / Comments" },
];

// ─── Finance Module Settings ──────────────────────────────────────────────────

export interface FinanceSettings {
  currency: string;
  invoicePrefix: string;
  dueDays: string;
  lateFeePercent: string;
  taxRate: string;
  paymentMethods: string[];
  autoGenerateInvoice: boolean;
  sendInvoiceEmail: boolean;
  allowPartialPayment: boolean;
  requireApproval: boolean;
  overdueReminder: boolean;
  reminderDaysBefore: string;
  feeReminders: boolean;
  defaultViewLayout?: string;
  fields?: Record<string, ModuleFieldConfig>;
  customFields?: ModuleCustomField[];
  fieldOrder?: string[];
}

export const DEFAULT_FINANCE_SETTINGS: FinanceSettings = {
  currency: "PKR",
  invoicePrefix: "INV",
  dueDays: "30",
  lateFeePercent: "5",
  taxRate: "0",
  paymentMethods: ["cash", "bank_transfer"],
  autoGenerateInvoice: true,
  sendInvoiceEmail: true,
  allowPartialPayment: true,
  requireApproval: false,
  overdueReminder: true,
  reminderDaysBefore: "3",
  feeReminders: true,
  defaultViewLayout: "list",
  fields: {
    method: { enabled: true, required: true },
    date: { enabled: true, required: true },
    receivedBy: { enabled: true, required: false },
    note: { enabled: true, required: false },
  },
  customFields: [],
  fieldOrder: ["method", "date", "receivedBy", "note"],
};

export const DEFAULT_FINANCE_FIELD_DEFS: ModuleFieldDef[] = [
  { id: "amount", label: "Amount", alwaysOn: true, required: true },
  { id: "method", label: "Payment Method" },
  { id: "date", label: "Payment Date" },
  { id: "receivedBy", label: "Received By" },
  { id: "note", label: "Note" },
];

// ─── Examinations Module Settings ─────────────────────────────────────────────

/**
 * Configuration for the Examinations module.
 * Stored under the key "examinations_settings".
 */
export interface ExaminationsSettings {
  /** Minimum mark required to pass. */
  passMark: string;
  /** Maximum achievable mark. */
  maxMark: string;
  /** Grading system: "percentage" | "gpa" | "letter" | "custom". */
  gradingSystem: string;
  /** Whether student rankings are displayed on result cards. */
  showRankings: boolean;
  /** Whether students can retake failed exams. */
  allowRetake: boolean;
  /** Whether results are published immediately after grading. */
  autoPublishResults: boolean;
  /** Whether students/guardians receive a notification when results are published. */
  notifyOnResult: boolean;
  /** Certificate template identifier. */
  certificateTemplate: string;
  /** Whether AI-assisted grading is enabled. */
  aiGrading: boolean;
  /** Whether honours/distinction are awarded to high scorers. */
  distinguishHonours: boolean;
  /** Whether exam reminder notifications are sent to students/guardians. */
  examReminders: boolean;
  defaultViewLayout?: string;
  fields?: Record<string, ModuleFieldConfig>;
  customFields?: ModuleCustomField[];
  fieldOrder?: string[];
}

/** Authoritative default values for ExaminationsSettings. */
export const DEFAULT_EXAMINATIONS_SETTINGS: ExaminationsSettings = {
  passMark: "50",
  maxMark: "100",
  gradingSystem: "percentage",
  showRankings: true,
  allowRetake: true,
  autoPublishResults: false,
  notifyOnResult: true,
  certificateTemplate: "default",
  aiGrading: false,
  distinguishHonours: true,
  examReminders: true,
  defaultViewLayout: "list",
  fields: {
    subject: { enabled: true, required: true },
    status: { enabled: true, required: true },
    totalMarks: { enabled: true, required: false },
    passingMarks: { enabled: true, required: false },
    duration: { enabled: true, required: false },
    description: { enabled: true, required: false },
  },
  customFields: [],
  fieldOrder: ["subject", "status", "totalMarks", "passingMarks", "duration", "description"],
};

export const DEFAULT_EXAMINATIONS_FIELD_DEFS: ModuleFieldDef[] = [
  { id: "name", label: "Exam Name", alwaysOn: true, required: true },
  { id: "subject", label: "Subject" },
  { id: "status", label: "Status" },
  { id: "totalMarks", label: "Total Marks" },
  { id: "passingMarks", label: "Passing Marks" },
  { id: "duration", label: "Duration (min)" },
  { id: "date", label: "Exam Date", alwaysOn: true, required: true },
  { id: "classIds", label: "Assign to Classes", alwaysOn: true, required: true },
  { id: "description", label: "Description" },
];

// ─── Sessions Module Settings ─────────────────────────────────────────────────

/**
 * Configuration for the Sessions module.
 * Stored under the key "sessions_settings".
 */
export interface SessionsSettings {
  /** Default session duration in months. */
  defaultDuration: string;
  /** Default session type: "annual" | "semester" | "trimester" | "quarterly". */
  defaultSessionType: string;
  /** Whether multiple active sessions can run simultaneously. */
  allowOverlap: boolean;
  /** Whether completed sessions are automatically archived. */
  archiveOldSessions: boolean;
  /** Whether a session must have a budget plan before activation. */
  requireBudget: boolean;
  /** Whether to warn when class schedules overlap. */
  timetableConflictCheck: boolean;
  /** Whether to send a notification when a new session begins. */
  notifyOnSessionStart: boolean;
  /** Current academic year label, e.g. "2025-2026". */
  academicYear: string;
  /** Month in which the academic session starts, e.g. "april". */
  sessionStart: string;
  defaultViewLayout?: string;
  fields?: Record<string, ModuleFieldConfig>;
  customFields?: ModuleCustomField[];
  fieldOrder?: string[];
}

/** Authoritative default values for SessionsSettings. */
export const DEFAULT_SESSIONS_SETTINGS: SessionsSettings = {
  defaultDuration: "12",
  defaultSessionType: "annual",
  allowOverlap: false,
  archiveOldSessions: true,
  requireBudget: false,
  timetableConflictCheck: true,
  notifyOnSessionStart: true,
  academicYear: "2025-2026",
  sessionStart: "april",
  defaultViewLayout: "cards",
  fields: {
    type: { enabled: true, required: true },
    status: { enabled: true, required: true },
    baseFee: { enabled: true, required: true },
    currency: { enabled: true, required: true },
    description: { enabled: true, required: false },
  },
  customFields: [],
  fieldOrder: ["type", "status", "baseFee", "currency", "description"],
};

export const DEFAULT_SESSIONS_FIELD_DEFS: ModuleFieldDef[] = [
  { id: "name", label: "Session Name", alwaysOn: true, required: true },
  { id: "type", label: "Session Type" },
  { id: "status", label: "Status" },
  { id: "startDate", label: "Start Date", alwaysOn: true, required: true },
  { id: "endDate", label: "End Date", alwaysOn: true, required: true },
  { id: "baseFee", label: "Base Fee" },
  { id: "currency", label: "Currency" },
  { id: "description", label: "Description" },
];

// ─── Enrollments Module Settings ──────────────────────────────────────────────

/**
 * Configuration for the Enrollments module.
 * Stored under the key "enrollments_settings".
 */
export interface EnrollmentsSettings {
  /** Maximum students allowed per class. */
  maxStudentsPerClass: string;
  /** Whether a waitlist is available when a class is full. */
  waitlistEnabled: boolean;
  /** Whether eligibility rules run before confirming enrollment. */
  requireEligibilityCheck: boolean;
  /** Whether the system auto-assigns students to the best available class. */
  autoAssignClass: boolean;
  /** Whether admin approval is required before enrollment is confirmed. */
  enrollmentApproval: boolean;
  /** Whether students can be transferred between classes. */
  allowTransfers: boolean;
  /** Days after enrollment within which a student can drop without penalty. */
  dropDeadlineDays: string;
  /** Whether guardians receive a reminder when re-enrollment opens. */
  reenrollmentReminder: boolean;
  defaultViewLayout?: string;
  fields?: Record<string, ModuleFieldConfig>;
  customFields?: ModuleCustomField[];
  fieldOrder?: string[];
}

/** Authoritative default values for EnrollmentsSettings. */
export const DEFAULT_ENROLLMENTS_SETTINGS: EnrollmentsSettings = {
  maxStudentsPerClass: "30",
  waitlistEnabled: true,
  requireEligibilityCheck: true,
  autoAssignClass: false,
  enrollmentApproval: true,
  allowTransfers: true,
  dropDeadlineDays: "14",
  reenrollmentReminder: true,
  defaultViewLayout: "list",
  fields: {
    notes: { enabled: true, required: false },
  },
  customFields: [],
  fieldOrder: ["notes"],
};

export const DEFAULT_ENROLLMENTS_FIELD_DEFS: ModuleFieldDef[] = [
  { id: "studentId", label: "Select Student", alwaysOn: true, required: true },
  { id: "sessionId", label: "Select Session", alwaysOn: true, required: true },
  { id: "classId", label: "Assign Class", alwaysOn: true, required: true },
  { id: "notes", label: "Notes" },
];

// ─── Students Module Settings ─────────────────────────────────────────────────

export interface StudentFieldConfig {
  enabled: boolean;
  required: boolean;
}

export interface StudentCustomField {
  id: string;
  label: string;
  type: "text" | "textarea" | "number" | "select" | "boolean" | "date";
  required?: boolean;
  options?: string[];
}

/**
 * Configuration for the Students module.
 * Stored under the key "students_settings".
 */
export interface StudentsSettings {
  /** Prefix for auto-generated student IDs, e.g. "STU". */
  idPrefix: string;
  /** Whether the system generates student IDs automatically. */
  autoGenerateId: boolean;
  /** Whether every student profile must have a guardian linked. */
  requireGuardian: boolean;
  /** Whether a profile photo is mandatory. */
  requirePhoto: boolean;
  /** Default gender pre-selected on the registration form; empty means no default. */
  defaultGender: string;
  /** Maximum allowed student age. */
  maxAge: string;
  /** Minimum allowed student age. */
  minAge: string;
  /** Whether sibling discounts are enabled in the fee structure. */
  allowSiblingDiscount: boolean;
  /** Whether health/medical notes can be recorded on student profiles. */
  trackHealthRecords: boolean;
  /** Format pattern for auto-generated GR Numbers, e.g. "{seq}-{year}" or "GR-{seq}". */
  grNumberTemplate: string;
  /** Zero-padding length for the GR number sequence. */
  grNumberDigits: number;
  /** Whether sequence restarts from 1 at the beginning of each year. */
  grNumberRestartAnnually: boolean;
  defaultViewLayout?: string;
  /** Field level customization visibility/requirement toggles */
  fields?: Record<string, StudentFieldConfig>;
  /** User defined dynamic custom fields */
  customFields?: StudentCustomField[];
  /** Sequence ordering of the default and custom fields in the form/views */
  fieldOrder?: string[];
}

/** Authoritative default values for StudentsSettings. */
export const DEFAULT_STUDENTS_SETTINGS: StudentsSettings = {
  idPrefix: "STU",
  autoGenerateId: true,
  requireGuardian: true,
  requirePhoto: false,
  defaultGender: "",
  maxAge: "25",
  minAge: "5",
  allowSiblingDiscount: true,
  trackHealthRecords: false,
  grNumberTemplate: "{seq}-{year}",
  grNumberDigits: 4,
  grNumberRestartAnnually: true,
  defaultViewLayout: "list",
  fields: {
    gender: { enabled: true, required: true },
    dob: { enabled: true, required: false },
    fatherLink: { enabled: true, required: false },
    motherLink: { enabled: true, required: false },
    registeredDate: { enabled: true, required: true },
  },
  customFields: [],
  fieldOrder: ["gender", "dob", "fatherLink", "motherLink", "registeredDate"],
};

export interface StudentFieldDef {
  id: string;
  label: string;
  isCustom?: boolean;
  alwaysOn?: boolean;
  type?: string;
  required?: boolean;
  options?: string[];
  enabled?: boolean;
}

export const DEFAULT_STUDENT_FIELD_DEFS: StudentFieldDef[] = [
  { id: "gender", label: "Gender" },
  { id: "dob", label: "Date of Birth (DOB)" },
  { id: "fatherLink", label: "Father Link / Name" },
  { id: "motherLink", label: "Mother Link / Name" },
  { id: "registeredDate", label: "Registration Date" },
];

/**
 * Returns a sorted list of all student field definitions (default & custom)
 * based on the saved display sequence order in StudentsSettings.
 */
export function getSortedStudentFields(
  fieldOrder: string[] | undefined,
  fieldsConfig: Record<string, StudentFieldConfig> | undefined,
  customFields: StudentCustomField[] | undefined
): StudentFieldDef[] {
  const defaults = DEFAULT_STUDENT_FIELD_DEFS.map((f) => {
    const cfg = fieldsConfig?.[f.id] || { enabled: true, required: false };
    return {
      ...f,
      enabled: cfg.enabled,
      required: cfg.required,
      alwaysOn: false,
    };
  });

  const customs = (customFields || []).map((f) => ({
    id: f.id,
    label: f.label,
    isCustom: true,
    alwaysOn: false,
    type: f.type,
    required: f.required,
    options: f.options,
    enabled: true,
  }));

  const all = [...defaults, ...customs];
  const order = fieldOrder || ["gender", "dob", "fatherLink", "motherLink", "registeredDate"];

  const orderMap = Object.fromEntries(order.map((id, index) => [id, index]));
  return all.sort((a, b) => {
    const ai = orderMap[a.id] ?? 9999;
    const bi = orderMap[b.id] ?? 9999;
    return ai - bi;
  });
}

// ─── Contact Preferences ─────────────────────────────────────────────────────

/**
 * Contact module preferences.
 * Stored under the key "contact_prefs".
 */
export interface ContactPrefs {
  /** Whether contacts with duplicate names/phones are allowed. */
  allowDuplicates: boolean;
  /** Whether a phone number is required when adding a contact. */
  requirePhone: boolean;
  /** Whether the UI offers auto-merge suggestions for likely duplicates. */
  autoMergeSuggestions: boolean;
  /** Pre-populated country for new contacts. */
  defaultCountry: string;
  /** Whether WhatsApp messaging actions are shown in the contacts UI. */
  showWhatsApp: boolean;
}

/** Authoritative default values for ContactPrefs. */
export const DEFAULT_CONTACT_PREFS: ContactPrefs = {
  allowDuplicates: false,
  requirePhone: true,
  autoMergeSuggestions: true,
  defaultCountry: "Pakistan",
  showWhatsApp: true,
};

// ─── Accounting Settings ─────────────────────────────────────────────────────

export interface AccountingSettings {
  currency: string;
  currencySymbol: string;
  dateFormat: string;
  decimalSeparator: "period" | "comma";
  decimalPlaces: number;
  fyStartMonth: string;
  accountCodeLength: number;
  requireNarration: boolean;
  allowEditPosted: boolean;
  autoPostDrafts: boolean;
  retainedEarningsAccount: string;
  organizationName: string;
  defaultViewLayout?: string;
  fields?: Record<string, ModuleFieldConfig>;
  customFields?: ModuleCustomField[];
  fieldOrder?: string[];
}

export const DEFAULT_ACCOUNTING_SETTINGS: AccountingSettings = {
  currency: "PKR",
  currencySymbol: "₨",
  dateFormat: "DD/MM/YYYY",
  decimalSeparator: "period",
  decimalPlaces: 2,
  fyStartMonth: "July",
  accountCodeLength: 4,
  requireNarration: true,
  allowEditPosted: false,
  autoPostDrafts: false,
  retainedEarningsAccount: "a3100",
  organizationName: "Al-Madrasa Al-Islamiyya",
  defaultViewLayout: "list",
  fields: {
    subtype: { enabled: true, required: false },
    description: { enabled: true, required: false },
  },
  customFields: [],
  fieldOrder: ["subtype", "description"],
};

export const DEFAULT_ACCOUNT_FIELD_DEFS: ModuleFieldDef[] = [
  { id: "code", label: "Account Code", alwaysOn: true, required: true },
  { id: "type", label: "Type", alwaysOn: true, required: true },
  { id: "name", label: "Account Name", alwaysOn: true, required: true },
  { id: "subtype", label: "Sub-type" },
  { id: "description", label: "Description" },
];

// ─── Hasanat Module Settings ──────────────────────────────────────────────────

export interface HasanatSettings {
  pointsPerUnit: number;
  autoApprovePayouts: boolean;
  defaultViewLayout?: string;
  fields?: Record<string, ModuleFieldConfig>;
  customFields?: ModuleCustomField[];
  fieldOrder?: string[];
}

export const DEFAULT_HASANAT_SETTINGS: HasanatSettings = {
  pointsPerUnit: 10,
  autoApprovePayouts: false,
  defaultViewLayout: "list",
  fields: {
    recipientClass: { enabled: true, required: false },
    issuedBy: { enabled: true, required: false },
  },
  customFields: [],
  fieldOrder: ["recipientClass", "issuedBy"],
};

export const DEFAULT_HASANAT_FIELD_DEFS: ModuleFieldDef[] = [
  { id: "denominationId", label: "Denomination", alwaysOn: true, required: true },
  { id: "recipientType", label: "Recipient Type", alwaysOn: true, required: true },
  { id: "recipientName", label: "Recipient Name", alwaysOn: true, required: true },
  { id: "recipientClass", label: "Class / Department" },
  { id: "quantity", label: "Quantity", alwaysOn: true, required: true },
  { id: "issuedDate", label: "Issued Date", alwaysOn: true, required: true },
  { id: "reason", label: "Reason / Achievement", alwaysOn: true, required: true },
  { id: "issuedBy", label: "Issued By" },
];

// ─── Users Module Settings ───────────────────────────────────────────────────

export interface UsersSettings {
  allowSelfRegistration: boolean;
  requireEmailVerification: boolean;
  defaultViewLayout?: string;
  fields?: Record<string, ModuleFieldConfig>;
  customFields?: ModuleCustomField[];
  fieldOrder?: string[];
}

export const DEFAULT_USERS_SETTINGS: UsersSettings = {
  allowSelfRegistration: false,
  requireEmailVerification: true,
  defaultViewLayout: "list",
  fields: {
    roles: { enabled: true, required: true },
  },
  customFields: [],
  fieldOrder: ["roles"],
};

export const DEFAULT_USERS_FIELD_DEFS: ModuleFieldDef[] = [
  { id: "name", label: "Full Name", alwaysOn: true, required: true },
  { id: "email", label: "Email Address", alwaysOn: true, required: true },
  { id: "roles", label: "System Roles", alwaysOn: true, required: true },
];

