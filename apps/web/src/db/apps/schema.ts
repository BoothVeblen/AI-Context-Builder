import { InferInsertModel, InferSelectModel, relations } from 'drizzle-orm'
import {
  boolean,
  index,
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
    opening_remarks: text('opening_remarks'),
    enable_video_interaction: boolean('enable_video_interaction'),
    workflow_tree_str: text('workflow_tree_str'),
    workflow_data_str: text('workflow_data_str'),
    published_workflow_tree_str: text('published_workflow_tree_str'),
    published_workflow_data_str: text('published_workflow_data_str'),
    api_model_id: text('api_model_id').unique(),
    parent_app_id: text('parent_app_id'),
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

export type App = InferSelectModel<typeof AppsTable>
export type NewApp = InferInsertModel<typeof AppsTable>

export const AppsRelations = relations(AppsTable, ({ one, many }) => ({
  ParentAppTable: one(AppsTable, {
    fields: [AppsTable.parent_app_id],
    references: [AppsTable.short_id],
  }),
  AppsDatasetsTable: many(AppsDatasetsTable),
}))
