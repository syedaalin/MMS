import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { fetchCollection } from '../services/dbSyncService.js';

/**
 * Server-first pilot: dedicated student resource routes (TanStack Query on FE).
 */
export default async function studentsRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> {
  fastify.addHook('preHandler', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.status(401).send({
        type: 'auth_required',
        message: 'Authentication is required',
      });
    }
  });

  fastify.get('/count', async (_request, reply) => {
    try {
      const data = await fetchCollection('students');
      const count = Array.isArray(data) ? data.length : 0;
      return reply.send({ count });
    } catch {
      return reply.status(500).send({
        type: 'database_error',
        message: 'Failed to count students',
      });
    }
  });
}
