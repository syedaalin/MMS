import { JWT } from '@fastify/jwt';
import { validateCredentials, createUser, type PublicUser } from './userService.js';
import { createWorkspace, getWorkspaceBySubdomain } from './workspaceService.js';
import { createAuthHandoff } from './authHandoffService.js';
import { saveObject } from '../db/database.js';
import type { Workspace } from '@mms/shared';
import { buildBrandingFromOnboarding, requiresTwoFactor } from '@mms/shared';
import { assertPasswordMeetsPolicy, getJwtExpiresIn, loadGlobalSettings } from './globalSettingsService.js';
import { runWithTenant } from '../utils/tenantContext.js';
import { seedTenantDefaults } from './tenantSeedService.js';

/** Public user shape re-exported for route usage. */
export type { PublicUser as User };

export interface AuthResult {
  token: string;
  user: PublicUser;
  requires2FA?: boolean;
}

export interface OnboardInput {
  email: string;
  adminName: string;
  password: string;
  subdomain: string;
  madrasaName: string;
  tagline?: string;
  country?: string;
  primaryColor?: string;
  secondaryColor?: string;
  logoUrl?: string;
  adminPhone?: string;
  website?: string;
  footerText?: string;
}

export interface OnboardResult extends AuthResult {
  workspace: Workspace;
  handoffCode: string;
}

export async function loginUser(
  email: string,
  password: string,
  workspaceSubdomain: string,
  jwtSigner: JWT
): Promise<AuthResult | null> {
  const user = await validateCredentials(email, password, workspaceSubdomain);
  if (!user) return null;

  const settings = await loadGlobalSettings();
  const expiresIn = await getJwtExpiresIn();
  const token = jwtSigner.sign(user, { expiresIn });
  return {
    token,
    user,
    requires2FA: requiresTwoFactor(settings, user),
  };
}

/** Onboarding is always available for new, unused subdomains. */
export async function isOnboardingAvailable(): Promise<boolean> {
  return true;
}

export async function onboardUser(
  input: OnboardInput,
  jwtSigner: JWT
): Promise<OnboardResult> {
  const workspace = await createWorkspace({
    subdomain: input.subdomain,
    madrasaName: input.madrasaName,
    tagline: input.tagline,
    country: input.country,
  });

  await runWithTenant(workspace.subdomain, async () => {
    await seedTenantDefaults();

    const branding = buildBrandingFromOnboarding({
      madrasaName: input.madrasaName,
      tagline: input.tagline,
      subdomain: workspace.subdomain,
      country: input.country,
      primaryColor: input.primaryColor,
      secondaryColor: input.secondaryColor,
      logoUrl: input.logoUrl,
      adminEmail: input.email,
      adminPhone: input.adminPhone,
      website: input.website,
      footerText: input.footerText,
    });
    await saveObject('branding', { ...branding, subdomain: workspace.subdomain });

    await assertPasswordMeetsPolicy(input.password);
    await createUser(input.email, input.adminName, input.password, 'admin', workspace.subdomain);
  });

  const user = await runWithTenant(workspace.subdomain, async () =>
    validateCredentials(input.email, input.password, workspace.subdomain)
  );
  if (!user) {
    throw new Error('Failed to create workspace administrator.');
  }

  const expiresIn = await getJwtExpiresIn();
  const token = jwtSigner.sign(user, { expiresIn });
  const authResult: AuthResult = { token, user };
  const handoffCode = createAuthHandoff(authResult);

  return { ...authResult, workspace, handoffCode };
}

export async function resolvePublicWorkspace(subdomain: string): Promise<Workspace | null> {
  return getWorkspaceBySubdomain(subdomain);
}
