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

import { AppsTable } from '../apps/schema'
import { UsersTable } from '../users/schema'

export const WorkspaceTable = pgTable(
  'workspace',
  {
    id: serial('id').primaryKey(),
    short_id: text('short_id').notNull(),
    user_id: text('user_id')
      .references(() => UsersTable.short_id)
      .notNull(),
    app_id: text('app_id')
      .references(() => AppsTable.short_id)
      .notNull(),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
    archived: boolean('archived').default(false).notNull(),
  },
  (workspace) => {
    return {
      unique_idx: uniqueIndex('unique_idx').on(workspace.short_id),
      user_id_idx: index('user_id_idx').on(workspace.user_id),
    }
  }
)

export type Workspace = InferModel<typeof WorkspaceTable>
export type NewWorkspace = InferModel<typeof WorkspaceTable, 'insert'>
