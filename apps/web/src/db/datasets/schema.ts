import { InferModel, relations } from 'drizzle-orm'
import {
  boolean,
  index,
  json,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

import { AppsDatasetsTable } from '../apps_datasets/schema'
import { UsersTable } from '../users/schema'

export const DatasetsTable = pgTable(
  'datasets',
  {
    id: serial('id').primaryKey(),
    short_id: text('short_id').unique().notNull(),
    name: text('name').notNull(),
    config: json('config'),
    api_dataset_id: text('api_dataset_id').unique().notNull(),
    created_by: text('created_by')
      .references(() => UsersTable.short_id)
      .notNull(),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
    archived: boolean('archived').default(false).notNull(),
  },
  (datasets) => {
    return {
      unique_idx: uniqueIndex('unique_idx').on(datasets.short_id),
      user_id_idx: index('user_id_idx').on(datasets.created_by),
    }
  }
)

export type Datasets = InferModel<typeof DatasetsTable>
export type NewDataset = InferModel<typeof DatasetsTable, 'insert'>

export const DatasetsRelations = relations(DatasetsTable, ({ many }) => ({
  AppsDatasetsTable: many(AppsDatasetsTable),
}))
