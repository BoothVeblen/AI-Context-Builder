import { InferModel } from 'drizzle-orm'
import {
  boolean,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

import { AppsTable } from '../apps/schema'
import { UsersTable } from '../users/schema'

export const SessionsTable = pgTable(
  'sessions',
  {
    id: serial('id').primaryKey(),
    short_id: text('short_id').notNull(),
    name: text('name').notNull(),
    app_id: text('app_id')
      .references(() => AppsTable.short_id)
      .notNull(),
    created_by: text('created_by')
      .references(() => UsersTable.short_id)
      .notNull(),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
    archived: boolean('archived').default(false).notNull(),
  },
  (sessions) => {
    return {
      unique_idx: uniqueIndex('unique_idx').on(sessions.short_id),
    }
  }
)

export type Session = InferModel<typeof SessionsTable>
export type NewSession = InferModel<typeof SessionsTable, 'insert'>
