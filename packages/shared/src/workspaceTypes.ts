/** Workspace / tenant record created during onboarding. */
export interface Workspace {
  id: string;
  subdomain: string;
  madrasaName: string;
  tagline?: string;
  country?: string;
  createdAt: string;
}

/** Public workspace row for apex registry / workspace picker UI. */
export interface PublicWorkspaceSummary {
  subdomain: string;
  madrasaName: string;
  tagline?: string;
  logoUrl?: string;
}

/** Response body for `GET /api/workspace/registry` (apex only). */
export interface WorkspaceRegistryResponse {
  workspaces: PublicWorkspaceSummary[];
}
