import { JWT } from '@fastify/jwt';
import { validateCredentials, userExistsWithRole, createUser, type PublicUser } from './userService.js';

/** Public user shape re-exported for route usage. */
export type { PublicUser as User };

export interface AuthResult {
  token: string;
  user: PublicUser;
}

/**
 * Validates login credentials against the users database and generates a JWT.
 *
 * @param {string} email - The email to authenticate.
 * @param {string} password - The plaintext password attempt.
 * @param {JWT} jwtSigner - The Fastify JWT utility.
 * @returns {Promise<AuthResult | null>} Signed token + user if valid, null otherwise.
 */
export async function loginUser(
  email: string,
  password: string,
  jwtSigner: JWT
): Promise<AuthResult | null> {
  const user = await validateCredentials(email, password);
  if (!user) return null;

  const token = jwtSigner.sign(user);
  return { token, user };
}

/**
 * Processes first-time admin onboarding.
 * Throws 409 if an admin account already exists to prevent duplicate admins.
 *
 * @param {string} email - The administrative email.
 * @param {string} adminName - The administrator's display name.
 * @param {string} password - The plaintext password to hash and store.
 * @param {JWT} jwtSigner - The Fastify JWT utility.
 * @returns {Promise<AuthResult>} Signed token and created administrator profile.
 */
export async function onboardUser(
  email: string,
  adminName: string,
  password: string,
  jwtSigner: JWT
): Promise<AuthResult> {
  if (await userExistsWithRole('admin')) {
    const err = new Error('An admin account already exists. Onboarding is disabled.');
    (err as Error & { statusCode: number }).statusCode = 409;
    throw err;
  }

  const user = await createUser(email, adminName, password, 'admin');
  const token = jwtSigner.sign(user);
  return { token, user };
}
