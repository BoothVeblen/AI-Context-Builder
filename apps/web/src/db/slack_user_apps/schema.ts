import { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import {
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

import { AppsTable } from '../apps/schema'
import { SessionsTable } from '../sessions/schema'

export const SlackUserAppsTable = pgTable(
  'slack_user_apps',
  {
    id: serial('id').primaryKey(),
    short_id: text('short_id').unique().notNull(),
    app_id: text('app_id').notNull(),
    team_id: text('team_id').notNull(),
    user_id: text('user_id').notNull(),
    context_app_id: text('context_app_id')
      .references(() => AppsTable.short_id)
      .notNull(),
    context_session_id: text('context_session_id')
      .references(() => SessionsTable.short_id)
      .notNull(),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
  },
  (slack_user_apps) => {
    return {
      unique_idx: uniqueIndex('unique_idx').on(slack_user_apps.short_id),
    }
  }
)

export type SlackUserApp = InferSelectModel<typeof SlackUserAppsTable>
export type NewSlackUserApp = InferInsertModel<typeof SlackUserAppsTable>
