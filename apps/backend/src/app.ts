import fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import dotenv from 'dotenv';
import { initDb, pingDatabase } from './db/database.js';
import authRoutes from './routes/auth.js';
import dbRoutes from './routes/db.js';
import contactRoutes from './routes/contacts.js';
import emailRoutes from './routes/email.js';
import workspaceRoutes from './routes/workspace.js';
import studentsRoutes from './routes/students.js';
import { tenantStorage, resolveSubdomainFromRequest } from './utils/tenantContext.js';

dotenv.config();

/**
 * Builds the Fastify application instance.
 * Initializes plugins, initializes database schema, and registers routing.
 *
 * @throws {Error} If the JWT_SECRET environment variable is not configured.
 * @returns {Promise<FastifyInstance>} The configured Fastify instance.
 */
export async function buildApp(): Promise<FastifyInstance> {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error(
      'JWT_SECRET environment variable is required but not set. ' +
      'Set it in your .env file or deployment environment before starting the server.'
    );
  }

  const app = fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
    },
  });

  await initDb();

  await app.register(rateLimit, {
    global: false,
  });

  app.addHook('onRequest', (request, _reply, done) => {
    const subdomain = resolveSubdomainFromRequest(
      request.hostname,
      request.headers['x-forwarded-host']
    );
    tenantStorage.run(subdomain, () => done());
  });

  // Register CORS — restrict to a specific origin in production
  const isProd = process.env.NODE_ENV === 'production';
  const allowedOrigin = process.env.ALLOWED_ORIGIN || 'http://localhost:5173';

  await app.register(cors, {
    origin: isProd ? allowedOrigin : true,
    credentials: true,
  });

  // Register JWT — secret is validated above, no insecure fallback
  await app.register(jwt, {
    secret: jwtSecret,
  });

  // Register routes
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(workspaceRoutes, { prefix: '/api/workspace' });
  await app.register(dbRoutes, { prefix: '/api/db' });
  await app.register(contactRoutes, { prefix: '/api/contacts' });
  await app.register(emailRoutes, { prefix: '/api/email' });
  await app.register(studentsRoutes, { prefix: '/api/students' });

  app.get('/health', async () => {
    return { status: 'OK', timestamp: new Date().toISOString() };
  });

  app.get('/ready', async (_request, reply) => {
    const dbOk = await pingDatabase();
    if (!dbOk) {
      return reply.status(503).send({
        type: 'server_error',
        status: 'not_ready',
        database: 'disconnected',
      });
    }
    return { status: 'ready', database: 'connected', timestamp: new Date().toISOString() };
  });

  return app;
}
