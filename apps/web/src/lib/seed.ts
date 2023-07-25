import 'server-only'

import { sql } from 'drizzle-orm'

import { db } from '@/lib/drizzle'

export async function seed() {
  await db.execute(sql`
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    short_id TEXT UNIQUE NOT NULL,
    last_name TEXT,
    first_name TEXT,
    image_url TEXT,
    username TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,
    archived BOOLEAN DEFAULT FALSE
  );
`)
  console.log(`Created "users" table`)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS apps (
      id SERIAL PRIMARY KEY,
      short_id VARCHAR(12) UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      icon TEXT NOT NULL,
      created_by TEXT NOT NULL,
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
      short_id VARCHAR(12) UNIQUE NOT NULL,
      name TEXT NOT NULL,
      app_id VARCHAR(12) NOT NULL,
      FOREIGN KEY (app_id) REFERENCES apps(short_id),
      created_by TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE,
      archived BOOLEAN DEFAULT FALSE
    );
  `)
  console.log(`Created "sessions" table`)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS workspace (
      id SERIAL PRIMARY KEY,
      short_id VARCHAR(12) UNIQUE NOT NULL,
      user_id TEXT NOT NULL,
      app_id VARCHAR(12) NOT NULL,
      FOREIGN KEY (app_id) REFERENCES apps(short_id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE,
      archived BOOLEAN DEFAULT FALSE
    );
  `)
  console.log(`Created "workspace" table`)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS datasets (
      id SERIAL PRIMARY KEY,
      short_id VARCHAR(12) UNIQUE NOT NULL,
      api_dataset_id TEXT UNIQUE NOT NULL,
      created_by TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      archived BOOLEAN DEFAULT FALSE,
      name TEXT NOT NULL,
      config json
    );
  `)
  console.log(`Created "datasets" table`)
}
