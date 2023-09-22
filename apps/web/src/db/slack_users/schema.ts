import { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import {
  boolean,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

import { UsersTable } from '../users/schema'

export const SlackUsersTable = pgTable(
  'slack_users',
  {
    id: serial('id').primaryKey(),
    short_id: text('short_id').unique().notNull(),
    app_id: text('app_id').notNull(),
    team_id: text('team_id').notNull(),
    user_id: text('user_id').notNull(),
    context_user_id: text('context_user_id')
      .references(() => UsersTable.short_id)
      .notNull(),
    is_admin: boolean('is_admin').default(false).notNull(),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
    archived: boolean('archived').default(false).notNull(),
  },
  (slack_users) => {
    return {
      unique_idx: uniqueIndex('unique_idx').on(slack_users.short_id),
    }
  }
)

export type SlackUser = InferSelectModel<typeof SlackUsersTable>
export type NewSlackUser = InferInsertModel<typeof SlackUsersTable>
