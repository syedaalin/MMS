/**
 * Global Contact Field Types & Registry
 *
 * Single source of truth for all contact field and tab definitions.
 *
 * Groups:  identity | demographics | location | professional | communication | other
 * Field types: text | textarea | number | date | select | tags | boolean | url | email
 */

/** Current schema version for migration detection. */
export const CONFIG_VERSION = 2;

/** Structure of a core/built-in contact field definition. */
export interface ContactField {
  id: string;
  label: string;
  type: "text" | "textarea" | "number" | "date" | "select" | "multiselect" | "tags" | "boolean" | "url" | "email" | "file" | "location" | "ai_summary";
  tab: string;
  group: string;
  alwaysOn?: boolean;
  alwaysRequired?: boolean;
  description: string;
}

/** Configuration for a specific contact persona (e.g. Student, Staff, Donor). */
export interface PersonaConfig {
  id: string;
  label: string;
  icon: string;
  enabledTabs: string[];
  requiredTabs: string[];
  tabFieldConfig: Record<string, TabFieldConfig>;
  tabCustomFields: Record<string, CustomField[]>;
}

/** Field group representation. */
export interface FieldGroup {
  id: string;
  label: string;
  description: string;
}

/** Tab description registry interface. */
export interface TabDefinition {
  id: string;
  label: string;
  description: string;
  alwaysOn?: boolean;
}

/** Field representation within specific tab layout. */
export interface TabFieldDefinition {
  id: string;
  label: string;
  description: string;
  alwaysOn?: boolean;
  alwaysRequired?: boolean;
}

/** Custom field schema configured by the administrator at runtime. */
export interface CustomField {
  id: string;
  label: string;
  type: "text" | "textarea" | "number" | "date" | "url" | "email" | "select" | "multiselect" | "tags" | "boolean" | "file" | "location" | "ai_summary";
  required?: boolean;
  unique?: boolean;
  placeholder?: string;
  description?: string;
  defaultValue?: string;
  options?: string[]; // stored as array of strings
  showInForm?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  mask?: string;
}

/** Saved config map for a specific tab. */
export interface TabFieldConfig {
  enabled: string[];
  required: string[];
  order?: string[];
}

/** Complete Contact Fields Configuration schema. */
export interface FieldConfig {
  version: number;
  enabled: string[]; // legacy flat enabled field IDs
  required: string[]; // legacy flat required field IDs
  enabledTabs: string[];
  requiredTabs: string[];
  tabFieldConfig: Record<string, TabFieldConfig>;
  customFields: CustomField[];
  tabCustomFields: Record<string, CustomField[]>;
  personas?: PersonaConfig[];       // @deprecated — persona system removed
  defaultPersonaId?: string;         // @deprecated — persona system removed
}

/** System Preferences for contacts. */
export interface ContactPreferences {
  defaultCountry: string;
  defaultProvince: string;
  defaultCity: string;
  defaultViewLayout?: string;
}

/** Individual Phone Number payload. */
export interface PhoneNumber {
  label: string;
  number: string;
  whatsapp?: boolean;
  countryCode?: string;
}

/** Individual Email Address payload. */
export interface EmailAddress {
  label: string;
  address: string;
}

/** Individual Address details payload. */
export interface Address {
  line1?: string;
  city?: string;
  state?: string;
  country?: string;
  label?: string;
}

/** Individual Social Media profile payload. */
export interface SocialLink {
  platform: string;
  url: string;
}

/** Emergency Contact relationship reference. */
export interface EmergencyContact {
  name?: string;
  relationship?: string;
  phone?: string;
  contactId?: string | number; // links to another contact
}

export interface ContactRelationship {
  contactId: string | number;
  type: string;
}

export interface ContactActivity {
  id: string;
  type: "note" | "stage_change" | "whatsapp" | "email" | "system" | "task" | "call";
  content: string;
  date: string;
  by?: string;
  metadata?: Record<string, unknown>;
}

export interface ContactAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string; // data URL or pointer
  date: string;
}

/** Contact document structure. */
export interface Contact {
  id: string | number;
  personaId?: string; // Links to PersonaConfig
  name: string;
  firstName: string;
  lastName?: string;
  gender?: string;
  dob?: string;
  isSyed?: boolean;
  avatar?: string | null;
  createdAt?: string;
  updatedAt?: string;
  phones?: PhoneNumber[];
  emails?: EmailAddress[];
  addresses?: Address[];
  socials?: SocialLink[];
  emergencyContacts?: EmergencyContact[];
  notes?: string;
  occupation?: string;
  communicationPref?: string;
  phone?: string;
  email?: string;
  lifecycleStage?: string;
  rating?: number;
  relationships?: ContactRelationship[];
  activities?: ContactActivity[];
  attachments?: ContactAttachment[];
  profileHealth?: number;
  aiSummary?: string;
  [key: string]: unknown; // supports custom dynamic fields
}

/**
 * Top-level flat field registry. Used by column-pickers and filter UIs that
 * need a single iterable list of all possible contact attributes.
 */
export const CONTACT_FIELD_REGISTRY: ContactField[] = [
  // ── BASIC TAB: Identity ──────────────────────────────────────────────────
  { id: "name",           label: "Full Name",       type: "text",    tab: "basic", group: "identity", alwaysOn: true,  alwaysRequired: true,  description: "Contact's legal full name. Auto-built from first + last name. Essential for identification & communication." },
  { id: "gender",         label: "Gender",          type: "select",  tab: "basic", group: "identity",                                        description: "Self-identified gender. Used for personalization & inclusive communication practices." },
  { id: "isSyed",         label: "Is Syed",         type: "boolean", tab: "basic", group: "identity",                                        description: "Whether contact is of Syed (Hashemite) lineage. Cultural/genealogical indicator." },
  { id: "dob",            label: "Date of Birth",   type: "date",    tab: "basic", group: "identity",                                        description: "Date of birth for age tracking, age-appropriate communications & milestone events." },
  { id: "aiSummary",      label: "AI Summary",      type: "ai_summary", tab: "basic", group: "identity",                                   description: "Automated summary of contact history and engagement." },

  // ── ADDRESSES TAB: Location ──────────────────────────────────────────────
  { id: "city",    label: "City",             type: "text", tab: "addresses", group: "location", description: "City of residence. Essential for logistics, event planning & geographical segmentation." },
  { id: "state",   label: "State / Province", type: "text", tab: "addresses", group: "location", description: "State, province, or division. Important for tax, legal & regional compliance tracking." },
  { id: "country", label: "Country",          type: "text", tab: "addresses", group: "location", description: "Country of residence. Essential for international programs, compliance & time zone coordination." },
];

/** Field groups metadata. */
export const FIELD_GROUPS: FieldGroup[] = [
  { id: "identity",      label: "Identity",      description: "Name, gender, lineage, date of birth" },
  { id: "demographics",  label: "Demographics",  description: "Age, nationality, language" },
  { id: "location",      label: "Location",      description: "City, state, country, postal code" },
  { id: "professional",  label: "Professional",  description: "Occupation, organization, industry" },
  { id: "communication", label: "Communication", description: "Phone, email, social media" },
  { id: "other",         label: "Other",         description: "Miscellaneous & custom fields" },
];

/** Ordered list of contact form tabs. */
export const TAB_REGISTRY: TabDefinition[] = [
  { id: "phones",    label: "Phone Numbers",    description: "Phone numbers tab",            alwaysOn: true },
  { id: "emails",    label: "Email Addresses",  description: "Email addresses tab"                          },
  { id: "addresses", label: "Addresses",        description: "Addresses tab"                                },
  { id: "socials",   label: "Social Links",     description: "Social media profiles tab"                    },
  { id: "emergency", label: "Emergency Contacts",description: "Emergency contact links tab"                 },
];

/** Per-tab built-in field definitions. */
export const TAB_FIELD_DEFINITIONS: Record<string, TabFieldDefinition[]> = {
  basic: [
    { id: "avatar",         label: "Profile Photo",          description: "Avatar upload & display. Personalizes contacts & aids quick visual identification." },
    { id: "isSyed",         label: "Is Syed",                description: "Syed (Hashemite) lineage indicator. Cultural/genealogical indicator." },
    { id: "firstName",      label: "First Name",             description: "First name input — required for all contacts.", alwaysOn: true, alwaysRequired: true },
    { id: "lastName",       label: "Last Name",              description: "Last name input. Combined with first name for full identification." },
    { id: "gender",         label: "Gender (Male / Female)", description: "Gender selector. Enables personalization & inclusive communication." },
    { id: "dob",            label: "Date of Birth",          description: "Date of birth for age tracking & milestone events." },
  ],
  phones: [
    { id: "label",    label: "Phone Type / Label",               description: "Select type of phone number (e.g. Mobile, Home, Work)." },
    { id: "number",   label: "Phone Number (with country code)", description: "Phone number input with country code. Primary channel for direct communication.", alwaysOn: true, alwaysRequired: true },
  ],
  emails: [
    { id: "label",   label: "Email Type / Label", description: "Select type of email address (e.g. Personal, Work, School)." },
    { id: "address", label: "Email Address",      description: "Email input field (unique per contact). Essential for formal communication & bulk outreach.", alwaysOn: true },
  ],
  addresses: [
    { id: "label",   label: "Address Type / Label", description: "Select type of address (e.g. Home, Work, Billing)." },
    { id: "line1",   label: "Street Address",       description: "Street/building address.", alwaysOn: true },
    { id: "city",    label: "City",                 description: "City of residence.",       alwaysOn: true },
    { id: "state",   label: "State / Province",     description: "State or province.",       alwaysOn: true },
    { id: "country", label: "Country",              description: "Country of residence.",    alwaysOn: true },
  ],
  socials: [
    { id: "platform", label: "Platform Selection", description: "Platform selection (Facebook, X, etc.)", alwaysOn: true },
    { id: "url",      label: "Social URL / Handle", description: "URL or handle input. Enables social media engagement & verification.", alwaysOn: true },
  ],
  emergency: [
    { id: "contactId", label: "Contact", description: "Contact picker — links existing contacts as emergency contacts.", alwaysOn: true },
    { id: "relationship", label: "Relationship", description: "Relationship with the emergency contact (e.g. Father, Mother, Spouse).", alwaysOn: true },
  ],
};

/** Default enabled/required field IDs per tab. */
export const DEFAULT_TAB_FIELD_CONFIG: Record<string, { enabled: string[]; required: string[] }> = {
  basic:     { enabled: ["avatar", "isSyed", "firstName", "lastName", "gender", "dob"], required: ["firstName"] },
  phones:    { enabled: ["label", "number"], required: ["number"] },
  emails:    { enabled: ["label", "address"], required: [] },
  addresses: { enabled: ["label", "line1", "city", "state", "country"], required: [] },
  socials:   { enabled: ["platform", "url"], required: [] },
  emergency: { enabled: ["contactId", "relationship"], required: ["contactId"] },
};

/** Default tab visibility configurations. */
export const DEFAULT_ENABLED_TABS = ["phones", "emails", "addresses", "socials", "emergency"];
export const DEFAULT_REQUIRED_TABS: string[] = [];

/** Standard drop-down list values. */
export const GENDERS = ["male", "female"];

export const LIFECYCLE_STAGES = [
  "Lead",
  "Active Student",
  "Alumnus",
  "Staff",
  "Donor",
  "Volunteer",
  "Parent",
];

export const LIFECYCLE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "Lead": { bg: "bg-blue-50 text-blue-700 border-blue-200", text: "text-blue-700", border: "border-blue-200" },
  "Active Student": { bg: "bg-emerald-50 text-emerald-700 border-emerald-200", text: "text-emerald-700", border: "border-emerald-200" },
  "Alumnus": { bg: "bg-violet-50 text-violet-700 border-violet-200", text: "text-violet-700", border: "border-violet-200" },
  "Staff": { bg: "bg-amber-50 text-amber-700 border-amber-200", text: "text-amber-700", border: "border-amber-200" },
  "Donor": { bg: "bg-rose-50 text-rose-700 border-rose-200", text: "text-rose-700", border: "border-rose-200" },
  "Volunteer": { bg: "bg-indigo-50 text-indigo-700 border-indigo-200", text: "text-indigo-700", border: "border-indigo-200" },
  "Parent": { bg: "bg-cyan-50 text-cyan-700 border-cyan-200", text: "text-cyan-700", border: "border-cyan-200" },
};

export const SOCIAL_PLATFORMS = [
  "Facebook", "Twitter / X", "Instagram", "LinkedIn", "TikTok", "YouTube",
  "WhatsApp", "Telegram", "Snapchat",
];

export const COUNTRY_CODES = [
  { country: "Pakistan",              code: "+92"  },
  { country: "United States",         code: "+1"   },
  { country: "United Kingdom",        code: "+44"  },
  { country: "Canada",                code: "+1"   },
  { country: "Australia",             code: "+61"  },
  { country: "India",                 code: "+91"  },
  { country: "Bangladesh",            code: "+880" },
  { country: "Egypt",                 code: "+20"  },
  { country: "Nigeria",               code: "+234" },
  { country: "Ghana",                 code: "+233" },
  { country: "Saudi Arabia",          code: "+966" },
  { country: "United Arab Emirates",  code: "+971" },
  { country: "Qatar",                 code: "+974" },
  { country: "Kuwait",                code: "+965" },
  { country: "Bahrain",               code: "+973" },
  { country: "Oman",                  code: "+968" },
  { country: "Malaysia",              code: "+60"  },
  { country: "Singapore",             code: "+65"  },
  { country: "Thailand",              code: "+66"  },
  { country: "Indonesia",             code: "+62"  },
];

export const RELATIONSHIPS = [
  "Father", "Mother", "Son", "Daughter", "Brother", "Sister",
  "Guardian", "Spouse", "Other",
];

// ── Legacy exports (kept for backward-compat, do not use in new code) ─────────
/**
 * @deprecated Use DEFAULT_TAB_FIELD_CONFIG instead.
 * Flat list of enabled field IDs — exists only for old consumers that haven't
 * migrated to the tab-based config.
 */
export const DEFAULT_ENABLED_FIELDS = [
  "name", "gender", "isSyed", "dob",
  "city", "state", "country",
];

/**
 * @deprecated Use DEFAULT_TAB_FIELD_CONFIG instead.
 */
export const DEFAULT_REQUIRED_FIELDS = ["name"];
