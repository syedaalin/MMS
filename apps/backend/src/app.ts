import fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import dotenv from 'dotenv';
import { initDb } from './db/database.js';
import authRoutes from './routes/auth.js';
import dbRoutes from './routes/db.js';

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

  // Initialize the SQLite database & seeds
  await initDb();

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
  await app.register(dbRoutes, { prefix: '/api/db' });

  // Basic health check route
  app.get('/health', async () => {
    return { status: 'OK', timestamp: new Date().toISOString() };
  });

  return app;
}
