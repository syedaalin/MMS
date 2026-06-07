import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { mergeBrandingSettings, toPublicBranding } from '@mms/shared';
import { getObject } from '../db/database.js';
import {
  getWorkspace,
  getWorkspaceBySubdomain,
  isSubdomainAvailable,
  listPublicWorkspaces,
  normalizeSubdomainInput,
} from '../services/workspaceService.js';
import { getRequestTenant, runWithTenant } from '../utils/tenantContext.js';

async function fetchPublicBrandingForSubdomain(subdomain: string) {
  return runWithTenant(subdomain, async () => {
    const raw = await getObject('branding');
    return toPublicBranding(mergeBrandingSettings(raw as Record<string, unknown> | null));
  });
}

export default async function workspaceRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> {
  fastify.get('/registry', async (_request, reply) => {
    if (getRequestTenant()) {
      return reply.status(404).send({ message: 'Not found' });
    }
    const workspaces = await listPublicWorkspaces();
    return reply.send({ workspaces });
  });

  fastify.get('/public-branding', async (request, reply) => {
    const workspace = await getWorkspace();
    if (!workspace) {
      return reply.status(404).send({ message: 'No workspace configured' });
    }
    const branding = await fetchPublicBrandingForSubdomain(workspace.subdomain);
    return reply.send({ branding });
  });

  fastify.get('/current', async (_request, reply) => {
    const workspace = await getWorkspace();
    if (!workspace) {
      return reply.status(404).send({ message: 'No workspace configured' });
    }
    const branding = await fetchPublicBrandingForSubdomain(workspace.subdomain);
    return reply.send({ workspace, branding });
  });

  fastify.get<{ Params: { subdomain: string } }>(
    '/by-subdomain/:subdomain',
    async (request, reply) => {
      const subdomain = normalizeSubdomainInput(request.params.subdomain);
      const workspace = await getWorkspaceBySubdomain(subdomain);
      if (!workspace) {
        return reply.status(404).send({ message: 'Workspace not found' });
      }
      const branding = await fetchPublicBrandingForSubdomain(workspace.subdomain);
      return reply.send({
        workspace: {
          subdomain: workspace.subdomain,
          madrasaName: branding.madrasaName || workspace.madrasaName,
          tagline: branding.tagline || workspace.tagline,
        },
        branding,
      });
    }
  );

  fastify.get<{ Params: { subdomain: string } }>(
    '/subdomain-available/:subdomain',
    async (request, reply) => {
      const subdomain = normalizeSubdomainInput(request.params.subdomain);
      const available = await isSubdomainAvailable(subdomain);
      return reply.send({ subdomain, available });
    }
  );
}
