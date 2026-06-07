import { useCallback, useEffect, useState } from "react";
import {
  cloneDefaultWorkspaceRoles,
  DEFAULT_USERS_SETTINGS,
  type UsersSettings,
  type WorkspaceRole,
} from "@mms/shared";
import { getObject } from "@/lib/db";

function readWorkspaceRoles(): WorkspaceRole[] {
  const settings = getObject<UsersSettings>("users_settings", DEFAULT_USERS_SETTINGS);
  if (settings.workspaceRoles?.length) {
    return settings.workspaceRoles.map((r) => ({
      ...r,
      permissions: structuredClone(r.permissions),
    }));
  }
  return cloneDefaultWorkspaceRoles();
}

/** Live workspace roles from `users_settings` (system + custom). */
export function useWorkspaceRoles(): WorkspaceRole[] {
  const [roles, setRoles] = useState<WorkspaceRole[]>(readWorkspaceRoles);

  const refresh = useCallback(() => setRoles(readWorkspaceRoles()), []);

  useEffect(() => {
    refresh();
    const onUpdate = (): void => refresh();
    window.addEventListener("local-database-update", onUpdate);
    return () => window.removeEventListener("local-database-update", onUpdate);
  }, [refresh]);

  return roles;
}
