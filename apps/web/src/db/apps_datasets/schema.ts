import { relations } from 'drizzle-orm'
import {
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

import { AppsTable } from '../apps/schema'
import { DatasetsTable } from '../datasets/schema'

export const AppsDatasetsTable = pgTable(
  'apps_datasets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    app_id: text('app_id')
      .references(() => AppsTable.short_id)
      .notNull(),
    dataset_id: text('dataset_id')
      .references(() => DatasetsTable.short_id)
      .notNull(),
    created_at: timestamp('created_at').defaultNow().notNull(),
  },
  (apps_datasets) => ({
    apps_datasets__app_id_dataset_id__idx: uniqueIndex(
      'apps_datasets__app_id_dataset_id__idx'
    ).on(apps_datasets.app_id, apps_datasets.dataset_id),
  })
)

export const AppsDatasetsRelations = relations(
  AppsDatasetsTable,
  ({ one }) => ({
    app: one(AppsTable, {
      fields: [AppsDatasetsTable.app_id],
      references: [AppsTable.short_id],
    }),
    dataset: one(DatasetsTable, {
      fields: [AppsDatasetsTable.dataset_id],
      references: [DatasetsTable.short_id],
    }),
  })
)
