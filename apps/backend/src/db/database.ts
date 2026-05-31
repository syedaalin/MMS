import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import { sql, eq } from 'drizzle-orm';
import { fileURLToPath } from 'url';
import path from 'path';
import * as schema from './schema.js';
import { getDefaultCollections, getDefaultObjects } from './seeds.js';
import { runMigration001 } from './migrations/001_migrate_notification_settings.js';
import { runMigration002 } from './migrations/002_migrate_global_settings_fields.js';

const { Pool } = pg;

let pool: pg.Pool;
let db: ReturnType<typeof drizzle<typeof schema>>;

/**
 * Initializes the PostgreSQL database, creates the necessary schema,
 * and seeds default data if the database is empty.
 *
 * @returns {Promise<void>}
 */
export async function initDb(): Promise<void> {
  try {
    const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/darul_quran';
    
    pool = new Pool({
      connectionString
    });
    
    db = drizzle(pool, { schema });

    // Run Drizzle migrations dynamically on start
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const migrationsFolder = path.resolve(__dirname, '../../src/db/migrations_drizzle');
    await migrate(db, { migrationsFolder });

    // Run pending data migrations — failures are fatal and halt startup
    await runMigration001();
    await runMigration002();

    // Check if seeding is necessary (if no collections exist)
    const results = await db.select({ count: sql<number>`count(*)` }).from(schema.collections);
    const count = results[0]?.count ?? 0;

    if (count === 0) {
      console.log('Database is empty. Seeding default collections and objects...');
      await seedDatabase();
    }
  } catch (error) {
    console.error('Failed to initialize the database:', error);
    throw error;
  }
}

/**
 * Seeds the database with default collections and objects.
 *
 * @returns {Promise<void>}
 */
export async function seedDatabase(): Promise<void> {
  try {
    // Seed using a transaction block for performance
    await runInTransaction(async () => {
      // Seed collections
      for (const [name, data] of Object.entries(getDefaultCollections())) {
        await saveCollection(name, data as unknown[]);
      }

      // Seed objects
      for (const [key, data] of Object.entries(getDefaultObjects())) {
        await saveObject(key, data);
      }
    });
    console.log('Database seeding completed successfully.');
  } catch (error) {
    console.error('Failed to seed the database:', error);
    throw error;
  }
}

/**
 * Retrieves a collection by name.
 *
 * @param {string} name - The collection name.
 * @returns {Promise<unknown[] | null>} The array of objects in the collection, or null if not found.
 */
export async function getCollection(name: string): Promise<unknown[] | null> {
  try {
    const rows = await db.select().from(schema.collections).where(eq(schema.collections.name, name));
    const row = rows[0];
    if (!row) {
      return null;
    }
    return JSON.parse(row.data) as unknown[];
  } catch (error) {
    console.error(`Error getting collection "${name}":`, error);
    throw error;
  }
}

/**
 * Saves/overwrites a collection.
 *
 * @param {string} name - The collection name.
 * @param {unknown[]} data - The data array to store.
 * @returns {Promise<void>}
 */
export async function saveCollection(name: string, data: unknown[]): Promise<void> {
  try {
    await db.insert(schema.collections)
      .values({ name, data: JSON.stringify(data) })
      .onConflictDoUpdate({
        target: schema.collections.name,
        set: { data: JSON.stringify(data) }
      });
  } catch (error) {
    console.error(`Error saving collection "${name}":`, error);
    throw error;
  }
}

/**
 * Retrieves a single object by key.
 *
 * @param {string} key - The object key.
 * @returns {Promise<unknown | null>} The parsed object, or null if not found.
 */
export async function getObject(key: string): Promise<unknown | null> {
  try {
    const rows = await db.select().from(schema.objects).where(eq(schema.objects.key, key));
    const row = rows[0];
    if (!row) {
      return null;
    }
    return JSON.parse(row.data) as unknown;
  } catch (error) {
    console.error(`Error getting object "${key}":`, error);
    throw error;
  }
}

/**
 * Saves/overwrites a single object.
 *
 * @param {string} key - The object key.
 * @param {unknown} data - The object data to store.
 * @returns {Promise<void>}
 */
export async function saveObject(key: string, data: unknown): Promise<void> {
  try {
    await db.insert(schema.objects)
      .values({ key, data: JSON.stringify(data) })
      .onConflictDoUpdate({
        target: schema.objects.key,
        set: { data: JSON.stringify(data) }
      });
  } catch (error) {
    console.error(`Error saving object "${key}":`, error);
    throw error;
  }
}

/**
 * Retrieves all collections and objects for bulk synchronization.
 *
 * @returns {Promise<{ collections: Record<string, unknown[]>; objects: Record<string, unknown> }>}
 */
export async function getAllData(): Promise<{ collections: Record<string, unknown[]>; objects: Record<string, unknown> }> {
  try {
    const collections: Record<string, unknown[]> = {};
    const colRows = await db.select().from(schema.collections);
    for (const row of colRows) {
      collections[row.name] = JSON.parse(row.data) as unknown[];
    }

    const objects: Record<string, unknown> = {};
    const objRows = await db.select().from(schema.objects);
    for (const row of objRows) {
      objects[row.key] = JSON.parse(row.data) as unknown;
    }

    return { collections, objects };
  } catch (error) {
    console.error('Error retrieving all database data:', error);
    throw error;
  }
}

/**
 * Resets the entire database schema and reseeds the default data.
 *
 * @returns {Promise<void>}
 */
export async function resetDatabase(): Promise<void> {
  try {
    await db.execute(sql`DROP TABLE IF EXISTS collections;`);
    await db.execute(sql`DROP TABLE IF EXISTS objects;`);
    await db.execute(sql`DROP TABLE IF EXISTS __drizzle_migrations;`);
    await initDb();
  } catch (error) {
    console.error('Error resetting database:', error);
    throw error;
  }
}

/**
 * Runs a callback within a database transaction block.
 *
 * @template T
 * @param {() => Promise<T>} cb - The callback containing operations to run.
 * @returns {Promise<T>} The result of the callback.
 */
export async function runInTransaction<T>(cb: () => Promise<T>): Promise<T> {
  try {
    return await db.transaction(async () => {
      return await cb();
    });
  } catch (error) {
    console.error('Database transaction rolled back due to error:', error);
    throw error;
  }
}
