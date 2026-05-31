import { FastifyInstance, FastifyPluginOptions, FastifySchema } from 'fastify';
import { loginUser, onboardUser, type User } from '../services/authService.js';

interface LoginBody {
  email?: string;
  password?: string;
}

interface OnboardBody {
  madrasaName?: string;
  tagline?: string;
  adminName?: string;
  email?: string;
  password?: string;
}

// Request validation schema for Login
const loginSchema: FastifySchema = {
  body: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', minLength: 3 },
      password: { type: 'string', minLength: 6 }
    }
  }
};

// Request validation schema for Onboarding
const onboardSchema: FastifySchema = {
  body: {
    type: 'object',
    required: ['madrasaName', 'adminName', 'email', 'password'],
    properties: {
      madrasaName: { type: 'string', minLength: 1 },
      tagline: { type: 'string' },
      adminName: { type: 'string', minLength: 1 },
      email: { type: 'string', minLength: 3 },
      password: { type: 'string', minLength: 6 }
    }
  }
};

/**
 * Register auth routes on the Fastify instance.
 *
 * @param {FastifyInstance} fastify - The fastify instance.
 * @param {FastifyPluginOptions} _options - Plugin options.
 * @returns {Promise<void>}
 */
export default async function authRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> {
  // Login route
  fastify.post<{ Body: LoginBody }>('/login', { schema: loginSchema }, async (request, reply) => {
    const { email, password } = request.body;

    const result = await loginUser(email!, password!, fastify.jwt);

    if (result) {
      return reply.send(result);
    }

    return reply.status(401).send({
      type: 'invalid_credentials',
      message: 'Invalid email or password'
    });
  });

  // Logout route (stateless JWT — client discards token)
  fastify.post('/logout', async (_request, reply) => {
    return reply.send({ success: true });
  });

  // Get current user (protected)
  fastify.get('/me', async (request, reply) => {
    try {
      await request.jwtVerify();
      return reply.send({
        user: request.user as User,
        isAuthenticated: true
      });
    } catch (error) {
      return reply.status(401).send({
        type: 'auth_required',
        message: 'Session expired or invalid token'
      });
    }
  });

  // Onboarding route — first-time admin setup only
  fastify.post<{ Body: OnboardBody }>('/onboard', { schema: onboardSchema }, async (request, reply) => {
    const { email, adminName, password } = request.body;

    try {
      const result = await onboardUser(email!, adminName!, password!, fastify.jwt);
      return reply.send(result);
    } catch (error: unknown) {
      const err = error as Error & { statusCode?: number };
      const statusCode = err.statusCode ?? 500;
      return reply.status(statusCode).send({
        type: statusCode === 409 ? 'conflict' : 'server_error',
        message: err.message || 'Onboarding failed'
      });
    }
  });
}
