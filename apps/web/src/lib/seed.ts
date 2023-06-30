import 'server-only'

import { sql } from 'drizzle-orm'

import { db } from '@/lib/drizzle'

export async function seed() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS apps (
      id SERIAL PRIMARY KEY,
      short_id VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      description VARCHAR(255) NOT NULL,
      icon VARCHAR(255) NOT NULL,
      created_by VARCHAR(255) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE,
      archived BOOLEAN DEFAULT FALSE
    );

    CREATE INDEX IF NOT EXISTS user_id_index ON apps (created_by);
  `)
  console.log(`Created "apps" table`)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS sessions (
      id SERIAL PRIMARY KEY,
      short_id VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      app_id VARCHAR(255) NOT NULL,
      FOREIGN KEY (app_id) REFERENCES apps(short_id),
      created_by VARCHAR(255) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE,
      archived BOOLEAN DEFAULT FALSE
    );
  `)
  console.log(`Created "sessions" table`)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS workspace (
      id SERIAL PRIMARY KEY,
      short_id VARCHAR(255) UNIQUE NOT NULL,
      user_id VARCHAR(255) NOT NULL,
      app_id VARCHAR(255) NOT NULL,
      FOREIGN KEY (app_id) REFERENCES apps(short_id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE,
      archived BOOLEAN DEFAULT FALSE
    );
  `)
  console.log(`Created "workspace" table`)
}
