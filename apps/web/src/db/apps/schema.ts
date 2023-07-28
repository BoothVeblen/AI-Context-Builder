import { InferModel, relations } from 'drizzle-orm'
import {
  boolean,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

import { AppsDatasetsTable } from '../apps_datasets/schema'
import { UsersTable } from '../users/schema'

export const AppsTable = pgTable(
  'apps',
  {
    id: serial('id').primaryKey(),
    short_id: text('short_id').unique().notNull(),
    name: text('name').notNull(),
    description: text('description').notNull(),
    icon: text('icon').notNull(),
    workflow_tree_str: text('workflow_tree_str'),
    workflow_data_str: text('workflow_data_str'),
    published_workflow_tree_str: text('published_workflow_tree_str'),
    published_workflow_data_str: text('published_workflow_data_str'),
    api_model_id: text('api_model_id').unique(),
    created_by: text('created_by')
      .references(() => UsersTable.short_id)
      .notNull(),
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

export const AppsRelations = relations(AppsTable, ({ many }) => ({
  AppsDatasetsTable: many(AppsDatasetsTable),
}))
