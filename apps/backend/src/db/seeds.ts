import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface SeedsData {
  DEFAULT_COLLECTIONS: Record<string, unknown[]>;
  DEFAULT_OBJECTS: Record<string, unknown>;
}

let cachedSeeds: SeedsData | null = null;

/**
 * Lazily loads seed data from seeds.json file.
 *
 * @returns {SeedsData} The parsed seeds data.
 */
function loadSeeds(): SeedsData {
  if (!cachedSeeds) {
    const jsonPath = path.join(__dirname, 'seeds.json');
    const raw = fs.readFileSync(jsonPath, 'utf8');
    cachedSeeds = JSON.parse(raw) as SeedsData;
  }
  return cachedSeeds;
}

/**
 * Returns the default collections for database seeding.
 *
 * @returns {Record<string, unknown[]>} Map of collection name to document array.
 */
export function getDefaultCollections(): Record<string, unknown[]> {
  return loadSeeds().DEFAULT_COLLECTIONS;
}

/**
 * Returns the default objects for database seeding.
 *
 * @returns {Record<string, unknown>} Map of object key to object data.
 */
export function getDefaultObjects(): Record<string, unknown> {
  return loadSeeds().DEFAULT_OBJECTS;
}
