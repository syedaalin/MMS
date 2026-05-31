import { FastifyInstance, FastifyPluginOptions, FastifySchema } from 'fastify';
import {
  fetchDatabaseSnapshot,
  synchronizeData,
  resetToDefaults,
  fetchCollection,
  persistCollection,
  fetchObject,
  persistObject,
  SyncPayload
} from '../services/dbSyncService.js';
import type { User } from '../services/authService.js';

// Input validation schema for Bulk Sync Upload
const syncSchema: FastifySchema = {
  body: {
    type: 'object',
    properties: {
      collections: {
        type: 'object',
        additionalProperties: {
          type: 'array',
          items: { type: 'object' }
        }
      },
      objects: {
        type: 'object',
        additionalProperties: { type: 'object' }
      }
    }
  }
};

// Route parameters validation for collections
const collectionParamsSchema: FastifySchema = {
  params: {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string', minLength: 1 }
    }
  }
};

// Validation schema for saving a collection (allows raw array or {data: array})
const collectionSaveSchema: FastifySchema = {
  params: {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string', minLength: 1 }
    }
  },
  body: {
    anyOf: [
      {
        type: 'array',
        items: { type: 'object' }
      },
      {
        type: 'object',
        required: ['data'],
        properties: {
          data: {
            type: 'array',
            items: { type: 'object' }
          }
        }
      }
    ]
  }
};

// Route parameters validation for KV objects
const objectParamsSchema: FastifySchema = {
  params: {
    type: 'object',
    required: ['key'],
    properties: {
      key: { type: 'string', minLength: 1 }
    }
  }
};

/**
 * Register database sync and CRUD routes on the Fastify instance.
 *
 * @param {FastifyInstance} fastify - The fastify instance.
 * @param {FastifyPluginOptions} _options - Plugin options.
 * @returns {Promise<void>}
 */
export default async function dbRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> {
  // Add a hook to verify JWT for all db routes
  fastify.addHook('preHandler', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (error) {
      return reply.status(401).send({
        type: 'auth_required',
        message: 'Authentication is required to access database endpoints'
      });
    }
  });

  // Bulk sync download: Get all data
  fastify.get('/sync', async (_request, reply) => {
    try {
      const data = await fetchDatabaseSnapshot();
      return reply.send(data);
    } catch (error) {
      return reply.status(500).send({
        type: 'database_error',
        message: 'Failed to retrieve database snapshot'
      });
    }
  });

  // Bulk sync upload: Save all data
  fastify.post<{ Body: SyncPayload }>('/sync', { schema: syncSchema }, async (request, reply) => {
    try {
      await synchronizeData(request.body);
      return reply.send({ success: true });
    } catch (error) {
      return reply.status(500).send({
        type: 'database_error',
        message: 'Failed to synchronize database snapshot'
      });
    }
  });

  // Reset database to defaults — admin role required
  fastify.post('/reset', async (request, reply) => {
    const user = request.user as User;
    if (user.role !== 'admin') {
      return reply.status(403).send({
        type: 'forbidden',
        message: 'Only administrators can reset the database'
      });
    }
    try {
      await resetToDefaults();
      return reply.send({ success: true, message: 'Database reset to default seeds' });
    } catch (error) {
      return reply.status(500).send({
        type: 'database_error',
        message: 'Failed to reset database'
      });
    }
  });

  // Get a specific collection
  fastify.get<{ Params: { name: string } }>('/collections/:name', { schema: collectionParamsSchema }, async (request, reply) => {
    try {
      const { name } = request.params;
      const data = await fetchCollection(name);
      if (data === null) {
        return reply.send([]);
      }
      return reply.send(data);
    } catch (error) {
      return reply.status(500).send({
        type: 'database_error',
        message: `Failed to retrieve collection "${request.params.name}"`
      });
    }
  });

  // Save/Overwrite a specific collection
  fastify.post<{ Params: { name: string }; Body: unknown }>(
    '/collections/:name',
    { schema: collectionSaveSchema },
    async (request, reply) => {
      try {
        const { name } = request.params;
        const body = request.body;

        // Parse collection array type-safely without utilizing 'any'
        let data: unknown[] | null = null;
        if (Array.isArray(body)) {
          data = body;
        } else if (body && typeof body === 'object' && 'data' in body) {
          const bodyWithData = body as { data: unknown };
          if (Array.isArray(bodyWithData.data)) {
            data = bodyWithData.data;
          }
        }

        if (!data) {
          return reply.status(400).send({
            type: 'validation_error',
            message: 'Request body must be an array of documents'
          });
        }

        await persistCollection(name, data);
        return reply.send({ success: true });
      } catch (error) {
        return reply.status(500).send({
          type: 'database_error',
          message: `Failed to save collection "${request.params.name}"`
        });
      }
    }
  );

  // Get a specific object (KV)
  fastify.get<{ Params: { key: string } }>('/objects/:key', { schema: objectParamsSchema }, async (request, reply) => {
    try {
      const { key } = request.params;
      const data = await fetchObject(key);
      if (data === null) {
        return reply.status(404).send({
          type: 'not_found',
          message: `Object with key "${key}" not found`
        });
      }
      return reply.send(data);
    } catch (error) {
      return reply.status(500).send({
        type: 'database_error',
        message: `Failed to retrieve object "${request.params.key}"`
      });
    }
  });

  // Save/Overwrite a specific object (KV)
  fastify.post<{ Params: { key: string }; Body: unknown }>('/objects/:key', { schema: objectParamsSchema }, async (request, reply) => {
    try {
      const { key } = request.params;
      const data = request.body;

      await persistObject(key, data);
      return reply.send({ success: true });
    } catch (error) {
      return reply.status(500).send({
        type: 'database_error',
        message: `Failed to save object "${request.params.key}"`
      });
    }
  });
}

