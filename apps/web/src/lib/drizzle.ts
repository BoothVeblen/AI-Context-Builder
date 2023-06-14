import { Pool as PoolServerless } from '@neondatabase/serverless'
import { InferModel } from 'drizzle-orm'
import { drizzle as drizzleServerless } from 'drizzle-orm/neon-serverless'
import { drizzle } from 'drizzle-orm/node-postgres'
import {
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { Pool } from 'pg'

import { flags } from './flags'

export const UsersTable = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    image: text('image').notNull(),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
  },
  (users) => {
    return {
      uniqueIdx: uniqueIndex('unique_idx').on(users.email),
    }
  }
)

export type User = InferModel<typeof UsersTable>
export type NewUser = InferModel<typeof UsersTable, 'insert'>

const pool = flags.isNeon
  ? new PoolServerless({ connectionString: process.env.DATABASE_URL })
  : new Pool({
      connectionString:
        process.env.DATABASE_URL ||
        'postgres://postgres:postgres@host.docker.internal:5432/postgres',
    })

export const db = flags.isNeon ? drizzleServerless(pool) : drizzle(pool)
