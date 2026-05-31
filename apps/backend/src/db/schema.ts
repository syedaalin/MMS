import { pgTable, text } from 'drizzle-orm/pg-core';

export const collections = pgTable('collections', {
  name: text('name').primaryKey(),
  data: text('data').notNull(),
});

export const objects = pgTable('objects', {
  key: text('key').primaryKey(),
  data: text('data').notNull(),
});
