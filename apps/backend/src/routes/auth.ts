import { FastifyInstance, FastifyPluginOptions, FastifySchema } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import {
  loginUser,
  onboardUser,
  isOnboardingAvailable,
  type User,
} from '../services/authService.js';
import { exchangeAuthHandoff } from '../services/authHandoffService.js';
import { resolveSubdomainFromRequest } from '../utils/tenantContext.js';

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
  subdomain?: string;
  country?: string;
  primaryColor?: string;
  secondaryColor?: string;
  logoUrl?: string;
  adminPhone?: string;
  website?: string;
  footerText?: string;
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
    required: ['madrasaName', 'adminName', 'email', 'password', 'subdomain'],
    properties: {
      madrasaName: { type: 'string', minLength: 1 },
      tagline: { type: 'string' },
      adminName: { type: 'string', minLength: 1 },
      email: { type: 'string', minLength: 3 },
      password: { type: 'string', minLength: 6 },
      subdomain: { type: 'string', minLength: 2 },
      country: { type: 'string' },
      primaryColor: { type: 'string' },
      secondaryColor: { type: 'string' },
      logoUrl: { type: 'string' },
      adminPhone: { type: 'string' },
      website: { type: 'string' },
      footerText: { type: 'string' },
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
const AUTH_RATE_LIMIT = {
  max: 10,
  timeWindow: '1 minute' as const,
};

export default async function authRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> {
  await fastify.register(async function authRateLimited(inner) {
    await inner.register(rateLimit, AUTH_RATE_LIMIT);

    inner.post<{ Body: LoginBody }>('/login', { schema: loginSchema }, async (request, reply) => {
    const { email, password } = request.body;
    const subdomain = resolveSubdomainFromRequest(
      request.hostname,
      request.headers['x-forwarded-host']
    );

    if (!subdomain) {
      return reply.status(400).send({
        type: 'invalid_credentials',
        message: 'Sign in on your madrasa subdomain (e.g. your-madrasa.localhost).',
      });
    }

    const result = await loginUser(email!, password!, subdomain, fastify.jwt);

    if (result) {
      return reply.send(result);
    }

    return reply.status(401).send({
      type: 'invalid_credentials',
      message: 'Invalid email or password'
    });
    });

    inner.post<{ Body: OnboardBody }>('/onboard', { schema: onboardSchema }, async (request, reply) => {
    const body = request.body;

    try {
      const result = await onboardUser(
        {
          email: body.email!,
          adminName: body.adminName!,
          password: body.password!,
          subdomain: body.subdomain!,
          madrasaName: body.madrasaName!,
          tagline: body.tagline,
          country: body.country,
          primaryColor: body.primaryColor,
          secondaryColor: body.secondaryColor,
          logoUrl: body.logoUrl,
          adminPhone: body.adminPhone,
          website: body.website,
          footerText: body.footerText,
        },
        fastify.jwt
      );
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

  // Whether first-time onboarding is still available (no admin yet)
  fastify.get('/onboarding-status', async (_request, reply) => {
    const available = await isOnboardingAvailable();
    return reply.send({ available });
  });

  // Exchange one-time handoff code after cross-subdomain onboarding redirect
  fastify.post<{ Body: { code?: string } }>('/handoff', async (request, reply) => {
    const code = request.body?.code;
    if (!code) {
      return reply.status(400).send({ message: 'Handoff code is required' });
    }
    const result = exchangeAuthHandoff(code);
    if (!result) {
      return reply.status(401).send({ message: 'Invalid or expired handoff code' });
    }
    return reply.send(result);
  });

}
