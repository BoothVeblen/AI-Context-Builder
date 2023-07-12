import { Pool as PoolServerless } from '@neondatabase/serverless'
import { drizzle as drizzleServerless } from 'drizzle-orm/neon-serverless'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

import { flags } from './flags'

const pool = flags.isNeon
  ? new PoolServerless({
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 10 * 1000, // wait 10s before timing out when connecting a new client
    })
  : new Pool({
      connectionString:
        process.env.DATABASE_URL ||
        'postgres://postgres:postgres@db:5432/postgres',
    })

export const db = flags.isNeon
  ? drizzleServerless(pool as PoolServerless)
  : drizzle(pool)
