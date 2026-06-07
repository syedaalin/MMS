/** Append-only audit trail entry stored in `audit_log` collection. */
export interface AuditLogEntry {
  id: string;
  at: string;
  userId: string;
  userEmail?: string;
  tenant?: string | null;
  action: string;
  entityType: "collection" | "object";
  entityId: string;
  summary?: string;
}

export const AUDIT_LOG_COLLECTION = "audit_log" as const;
