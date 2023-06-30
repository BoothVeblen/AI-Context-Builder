import { InferModel } from 'drizzle-orm'
import {
  boolean,
  index,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

export const AppsTable = pgTable(
  'apps',
  {
    id: serial('id').primaryKey(),
    short_id: text('short_id').notNull(),
    name: text('name').notNull(),
    description: text('description').notNull(),
    icon: text('icon').notNull(),
    created_by: text('created_by').notNull(),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
    archived: boolean('archived').default(false).notNull(),
  },
  (apps) => {
    return {
      unique_idx: uniqueIndex('unique_idx').on(apps.short_id),
      user_id_idx: index('user_id_idx').on(apps.created_by),
    }
  }
)

export type App = InferModel<typeof AppsTable>
export type NewApp = InferModel<typeof AppsTable, 'insert'>
