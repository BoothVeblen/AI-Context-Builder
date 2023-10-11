import { InferModel } from 'drizzle-orm'
import {
  boolean,
  integer,
  json,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

import { AppsTable } from '../apps/schema'
import { DatasetsTable } from '../datasets/schema'
import { UsersTable } from '../users/schema'

export const DocumentsTable = pgTable(
  'documents',
  {
    id: serial('id').primaryKey(),
    short_id: text('short_id').unique().notNull(),
    uid: text('uid').notNull(), // pdf:file_id, annotated_data:api_model_id
    dataset_id: text('dataset_id')
      .references(() => DatasetsTable.short_id)
      .notNull(),
    type: text('type').notNull(), // pdf, annotated_data
    name: text('name'), // pdf
    url: text('url'), // pdf
    icon: text('icon'), //annotated_data
    app_id: text('app_id').references(() => AppsTable.short_id), // get app info
    status: integer('status').default(0).notNull(),
    characters: integer('characters'),
    config: json('config'),
    created_by: text('created_by')
      .references(() => UsersTable.short_id)
      .notNull(),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
    archived: boolean('archived').default(false).notNull(),
  },
  (documents) => {
    return {
      unique_idx: uniqueIndex('unique_idx').on(documents.short_id),
    }
  }
)

export type Documents = InferModel<typeof DocumentsTable>
export type NewDocument = InferModel<typeof DocumentsTable, 'insert'>
