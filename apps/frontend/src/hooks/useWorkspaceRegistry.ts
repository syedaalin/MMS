import { useQuery } from "@tanstack/react-query";
import type { PublicWorkspaceSummary, WorkspaceRegistryResponse } from "@mms/shared";

export const WORKSPACE_REGISTRY_QUERY_KEY = ["workspace", "registry"] as const;

async function fetchWorkspaceRegistry(): Promise<PublicWorkspaceSummary[]> {
  const res = await fetch("/api/workspace/registry");
  if (!res.ok) {
    throw new Error(`workspace_registry_${res.status}`);
  }
  const body = (await res.json()) as WorkspaceRegistryResponse;
  return body.workspaces;
}

/** Apex-only list of registered madrasa workspaces (TanStack Query). */
export function useWorkspaceRegistry() {
  return useQuery({
    queryKey: WORKSPACE_REGISTRY_QUERY_KEY,
    queryFn: fetchWorkspaceRegistry,
    staleTime: 30_000,
  });
}
