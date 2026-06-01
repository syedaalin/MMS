import { CONTACTS } from "./contactsData.js";
import { validateSessions } from "./sessionsData";
import { type GlobalSettings, DEFAULT_GLOBAL_SETTINGS } from "@mms/shared";

interface StudentRecord extends Record<string, unknown> {
  contactId?: string | number;
  fatherContactId?: string | number;
  motherContactId?: string | number;
  name?: string;
  gender?: string;
  dob?: string;
  phone?: string;
  email?: string;
  city?: string;
  fatherName?: string;
  motherName?: string;
}

interface ContactRecord extends Record<string, unknown> {
  id: string | number;
  name?: string;
  gender?: string;
  dob?: string;
  phone?: string;
  email?: string;
  city?: string;
  phones?: { number: string }[];
  emails?: { address: string }[];
}

/**
 * Hydrates a list of students by resolving contact details from the contacts collection.
 *
 * @param {StudentRecord[]} studentsList - The list of raw/stored students.
 * @returns {StudentRecord[]} The hydrated list of students with resolved contact/parent fields.
 */
function hydrateStudents(studentsList: StudentRecord[]): StudentRecord[] {
  if (!Array.isArray(studentsList)) return studentsList;
  const contacts = getCollection<ContactRecord>("contacts", CONTACTS as ContactRecord[]);
  return studentsList.map((student) => {
    if (!student) return student;
    const hydrated = { ...student };
    
    // If student is linked to a contact, retrieve fields from that contact
    if (student.contactId) {
      const contact = contacts.find((c) => String(c.id) === String(student.contactId));
      if (contact) {
        hydrated.name = contact.name || hydrated.name;
        hydrated.gender = contact.gender || hydrated.gender;
        hydrated.dob = contact.dob || hydrated.dob;
        hydrated.phone = contact.phone || (contact.phones && contact.phones[0]?.number) || hydrated.phone;
        hydrated.email = contact.email || (contact.emails && contact.emails[0]?.address) || hydrated.email;
        hydrated.city = contact.city || hydrated.city;
      }
    }
    
    // If father is linked to a contact, retrieve name from that contact
    if (student.fatherContactId) {
      const contact = contacts.find((c) => String(c.id) === String(student.fatherContactId));
      if (contact) {
        hydrated.fatherName = contact.name || hydrated.fatherName;
      }
    }

    // If mother is linked to a contact, retrieve name from that contact
    if (student.motherContactId) {
      const contact = contacts.find((c) => String(c.id) === String(student.motherContactId));
      if (contact) {
        hydrated.motherName = contact.name || hydrated.motherName;
      }
    }

    return hydrated;
  });
}

/**
 * Normalizes a list of students before saving to avoid duplicate data.
 *
 * @param {StudentRecord[]} studentsList - The list of hydrated students.
 * @returns {StudentRecord[]} The normalized list of students.
 */
function normalizeStudentsBeforeSave(studentsList: StudentRecord[]): StudentRecord[] {
  if (!Array.isArray(studentsList)) return studentsList;
  return studentsList.map((student) => {
    if (!student) return student;
    const normalized = { ...student };

    if (normalized.contactId) {
      delete normalized.name;
      delete normalized.gender;
      delete normalized.dob;
      delete normalized.phone;
      delete normalized.email;
      delete normalized.city;
    }

    if (normalized.fatherContactId) {
      delete normalized.fatherName;
    }

    if (normalized.motherContactId) {
      delete normalized.motherName;
    }

    return normalized;
  });
}

// ─── Sync Status ─────────────────────────────────────────────────────────────

/** Possible states of the background server synchronization. */
export type SyncStatus = 'idle' | 'syncing' | 'error';

let _syncStatus: SyncStatus = 'idle';

/**
 * Returns the current background sync status.
 *
 * @returns {SyncStatus} The current sync status.
 */
export function getSyncStatus(): SyncStatus {
  return _syncStatus;
}

function setSyncStatus(status: SyncStatus): void {
  _syncStatus = status;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('sync-status-change', { detail: status }));
  }
}

/**
 * Generates authorization headers using the current token in localStorage.
 *
 * @param {string} [token] - Optional token override.
 * @returns {Record<string, string>} Headers dictionary.
 */
function getHeaders(token?: string): Record<string, string> {
  const t = token || localStorage.getItem("mms_token");
  return {
    "Content-Type": "application/json",
    ...(t ? { "Authorization": `Bearer ${t}` } : {})
  };
}

/**
 * Performs a background write to the server and tracks sync status.
 *
 * @param {string} url - API endpoint URL.
 * @param {unknown} body - Object or Array to send.
 * @returns {Promise<void>}
 */
async function syncToServer(url: string, body: unknown): Promise<void> {
  try {
    const token = localStorage.getItem("mms_token");
    if (!token) return; // Skip background writes if not authenticated yet

    setSyncStatus('syncing');
    const response = await fetch(url, {
      method: "POST",
      headers: getHeaders(token),
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      console.warn(`Sync to server failed for ${url} (status: ${response.status})`);
      setSyncStatus('error');
    } else {
      setSyncStatus('idle');
    }
  } catch (error) {
    console.error(`Network error during background sync for ${url}:`, error);
    setSyncStatus('error');
  }
}

/**
 * Performs a complete synchronization pull from the backend.
 * Downloads all collections and objects, updates the local cache, and notifies observers.
 *
 * @param {string} [token] - The authentication token.
 * @returns {Promise<void>}
 */
export async function syncDatabase(token?: string): Promise<void> {
  try {
    const activeToken = token || localStorage.getItem("mms_token");
    if (!activeToken) return;

    const response = await fetch("/api/db/sync", {
      headers: getHeaders(activeToken)
    });

    if (response.ok) {
      const data = await response.json() as {
        collections?: Record<string, unknown[]>;
        objects?: Record<string, unknown>;
      };
      
      // Update collections
      if (data.collections) {
        for (const [name, list] of Object.entries(data.collections)) {
          localStorage.setItem(`mms_${name}`, JSON.stringify(list));
        }
      }

      // Update objects
      if (data.objects) {
        for (const [key, obj] of Object.entries(data.objects)) {
          localStorage.setItem(`mms_${key}`, JSON.stringify(obj));
        }
      }

      // Notify the frontend components to update their states
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("local-database-update"));
      }
      console.log("Database sync from backend completed successfully.");
    } else {
      console.warn(`Failed to pull data from backend (status: ${response.status})`);
    }
  } catch (error) {
    console.error("Failed to sync database with backend:", error);
  }
}

/**
 * Retrieves a collection from localStorage. If not found, seeds it with the provided default data.
 *
 * @template T
 * @param {string} key - Unique key for storage.
 * @param {T[]} defaultData - Fallback data used if the collection does not exist.
 * @returns {T[]} The loaded collection.
 */
export function getCollection<T>(key: string, defaultData: T[]): T[] {
  try {
    const saved = localStorage.getItem(`mms_${key}`);
    if (saved !== null) {
      const parsed = JSON.parse(saved) as unknown;
      if (Array.isArray(parsed)) {
        let collection = parsed as T[];
        if (key === "students") {
          collection = hydrateStudents(collection as unknown as StudentRecord[]) as unknown as T[];
        } else if (key === "sessions") {
          collection = validateSessions(collection) as unknown as T[];
        }
        return collection;
      }
    }
    // Seed locally, and sync to backend
    let dataToSave = defaultData;
    if (key === "students") {
      dataToSave = normalizeStudentsBeforeSave(defaultData as unknown as StudentRecord[]) as unknown as T[];
    } else if (key === "sessions") {
      dataToSave = validateSessions(defaultData) as unknown as T[];
    }
    localStorage.setItem(`mms_${key}`, JSON.stringify(dataToSave));
    
    // Sync to backend asynchronously
    void syncToServer(`/api/db/collections/${key}`, dataToSave);

    let seedData = defaultData;
    if (key === "students") {
      seedData = hydrateStudents(dataToSave as unknown as StudentRecord[]) as unknown as T[];
    } else if (key === "sessions") {
      seedData = validateSessions(dataToSave) as unknown as T[];
    }
    return seedData;
  } catch (error) {
    console.error(`Error reading collection "${key}" from database:`, error);
    return defaultData;
  }
}

/**
 * Saves a collection to localStorage and synchronizes in background with backend.
 *
 * @template T
 * @param {string} key - Unique key for storage.
 * @param {T[]} data - Collection data to save.
 * @returns {void}
 */
export function saveCollection<T>(key: string, data: T[]): void {
  try {
    let dataToSave = data;
    if (key === "students") {
      dataToSave = normalizeStudentsBeforeSave(data as unknown as StudentRecord[]) as unknown as T[];
    }
    localStorage.setItem(`mms_${key}`, JSON.stringify(dataToSave));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("local-database-update"));
    }

    // Sync to backend asynchronously
    void syncToServer(`/api/db/collections/${key}`, dataToSave);
  } catch (error) {
    console.error(`Error writing collection "${key}" to database:`, error);
  }
}

/**
 * Retrieves a single object/record from localStorage. If not found, seeds it.
 *
 * @template T
 * @param {string} key - Unique key for storage.
 * @param {T} defaultData - Fallback data.
 * @returns {T} The loaded object.
 */
export function getObject<T>(key: string, defaultData: T): T {
  try {
    const saved = localStorage.getItem(`mms_${key}`);
    if (saved !== null) {
      return JSON.parse(saved) as T;
    }
    localStorage.setItem(`mms_${key}`, JSON.stringify(defaultData));

    // Sync to backend asynchronously
    void syncToServer(`/api/db/objects/${key}`, defaultData);

    return defaultData;
  } catch (error) {
    console.error(`Error reading object "${key}" from database:`, error);
    return defaultData;
  }
}

/**
 * Saves a single object/record to localStorage and synchronizes in background with backend.
 *
 * @template T
 * @param {string} key - Unique key for storage.
 * @param {T} data - Object data to save.
 * @returns {void}
 */
export function saveObject<T>(key: string, data: T): void {
  try {
    localStorage.setItem(`mms_${key}`, JSON.stringify(data));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("local-database-update"));
    }

    // Sync to backend asynchronously
    void syncToServer(`/api/db/objects/${key}`, data);
  } catch (error) {
    console.error(`Error writing object "${key}" to database:`, error);
  }
}

/**
 * Scans all keys in localStorage starting with "mms_",
 * and returns a JSON string representation of all matching key-value pairs.
 *
 * @returns {string} The serialized database JSON string.
 */
export function exportDatabase(): string {
  try {
    const data: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("mms_")) {
        const val = localStorage.getItem(key);
        if (val !== null) {
          data[key] = val;
        }
      }
    }
    return JSON.stringify(data);
  } catch (error) {
    console.error("Error exporting database:", error);
    throw error;
  }
}

/**
 * Clears all existing "mms_" keys from localStorage, parses
 * the provided JSON string, imports the stored key-value pairs and pushes to backend.
 *
 * @param {string} jsonString - The serialized database JSON string.
 * @returns {void}
 */
export function importDatabase(jsonString: string): void {
  try {
    const data = JSON.parse(jsonString) as Record<string, unknown>;
    if (!data || typeof data !== "object") {
      throw new Error("Invalid backup data format");
    }

    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("mms_")) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));

    const collections: Record<string, unknown[]> = {};
    const objects: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      if (key.startsWith("mms_") && typeof value === "string") {
        localStorage.setItem(key, value);

        const parsedVal = JSON.parse(value) as unknown;
        const name = key.replace("mms_", "");
        if (Array.isArray(parsedVal)) {
          collections[name] = parsedVal;
        } else {
          objects[name] = parsedVal;
        }
      }
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("local-database-update"));
    }

    // Pushes backup bulk sync to backend
    void syncToServer("/api/db/sync", { collections, objects });
  } catch (error) {
    console.error("Error importing database:", error);
    throw error;
  }
}

/**
 * Formats a Date object or date string according to the active global date format.
 *
 * @param {string | Date | null | undefined} date - The date to format.
 * @param {boolean} [showMonthName] - Whether to show the short month name instead of numeric.
 * @returns {string} The formatted date string.
 */
export function formatDate(date: string | Date | null | undefined, showMonthName = false): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";

  const settings = getObject<GlobalSettings>("global_settings", DEFAULT_GLOBAL_SETTINGS);
  const format = settings?.dateFormat || "DD/MM/YYYY";

  if (showMonthName) {
    const day = d.getDate();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    
    if (format === "MM/DD/YYYY") {
      return `${month} ${day}, ${year}`;
    }
    if (format === "YYYY-MM-DD") {
      return `${year}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
    return `${day} ${month} ${year}`;
  }

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = String(d.getFullYear());

  if (format === "MM/DD/YYYY") {
    return `${month}/${day}/${year}`;
  }
  if (format === "YYYY-MM-DD") {
    return `${year}-${month}-${day}`;
  }
  // Default is DD/MM/YYYY
  return `${day}/${month}/${year}`;
}
