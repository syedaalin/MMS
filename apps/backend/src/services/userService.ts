import { scrypt, randomBytes, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { getCollection, saveCollection } from '../db/database.js';
import { type User } from '@mms/shared';

const scryptAsync = promisify(scrypt);

/** Stored user shape persisted in the "users" collection. */
export interface StoredUser {
  id: string;
  email: string;
  name: string;
  role: string;
  /** Salted hash encoded as "salt:hash" (hex). */
  passwordHash: string;
  createdAt: string;
}

/** Public user shape — no password hash. */
export type PublicUser = User;

const COLLECTION = 'users';

/**
 * Hashes a plaintext password with a random salt using scrypt.
 *
 * @param {string} password - Plaintext password.
 * @returns {Promise<string>} Encoded "salt:hash" string (hex).
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = await scryptAsync(password, salt, 64) as Buffer;
  return `${salt}:${derivedKey.toString('hex')}`;
}

/**
 * Verifies a plaintext password against a stored "salt:hash" string.
 *
 * @param {string} password - Plaintext password to verify.
 * @param {string} storedHash - Previously stored "salt:hash" string.
 * @returns {Promise<boolean>} True if the password matches.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) return false;
  const derivedKey = await scryptAsync(password, salt, 64) as Buffer;
  const hashBuffer = Buffer.from(hash, 'hex');
  if (derivedKey.length !== hashBuffer.length) return false;
  return timingSafeEqual(derivedKey, hashBuffer);
}

/**
 * Retrieves all stored users from the database.
 *
 * @returns {Promise<StoredUser[]>} Array of all users.
 */
export async function getAllUsers(): Promise<StoredUser[]> {
  const raw = await getCollection(COLLECTION);
  if (!Array.isArray(raw)) return [];
  return raw as unknown as StoredUser[];
}

/**
 * Finds a user by email address (case-insensitive).
 *
 * @param {string} email - Email address to look up.
 * @returns {Promise<StoredUser | undefined>} The user if found.
 */
export async function findUserByEmail(email: string): Promise<StoredUser | undefined> {
  const users = await getAllUsers();
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

/**
 * Returns true if any user with the given role exists in the database.
 *
 * @param {string} role - The role to check for (e.g. "admin").
 * @returns {Promise<boolean>}
 */
export async function userExistsWithRole(role: string): Promise<boolean> {
  return (await getAllUsers()).some((u) => u.role === role);
}

/**
 * Creates and persists a new user account.
 * Throws if a user with the same email already exists.
 *
 * @param {string} email - User email address.
 * @param {string} name - Display name.
 * @param {string} password - Plaintext password (will be hashed).
 * @param {string} role - Role identifier (e.g. "admin").
 * @returns {Promise<PublicUser>} The created user without the password hash.
 */
export async function createUser(
  email: string,
  name: string,
  password: string,
  role: string
): Promise<PublicUser> {
  if (await findUserByEmail(email)) {
    throw new Error(`User with email "${email}" already exists.`);
  }

  const passwordHash = await hashPassword(password);
  const user: StoredUser = {
    id: randomBytes(8).toString('hex'),
    email,
    name,
    role,
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  const users = await getAllUsers();
  users.push(user);
  await saveCollection(COLLECTION, users);

  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

/**
 * Validates credentials and returns the public user profile if correct.
 *
 * @param {string} email - Email address.
 * @param {string} password - Plaintext password attempt.
 * @returns {Promise<PublicUser | null>} Public user if valid, null otherwise.
 */
export async function validateCredentials(
  email: string,
  password: string
): Promise<PublicUser | null> {
  const user = await findUserByEmail(email);
  if (!user) return null;

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return null;

  return { id: user.id, email: user.email, name: user.name, role: user.role };
}
