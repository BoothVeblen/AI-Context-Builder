import { InferModel } from 'drizzle-orm'
import {
  boolean,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

export const UsersTable = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    short_id: text('short_id').unique().notNull(),
    username: text('username'),
    email: text('email'),
    last_name: text('last_name'),
    first_name: text('first_name'),
    image_url: text('image_url'),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
    archived: boolean('archived').default(false).notNull(),
  },
  (users) => {
    return {
      unique_idx: uniqueIndex('unique_idx').on(users.short_id),
    }
  }
)

export type User = InferModel<typeof UsersTable>
export type NewUser = InferModel<typeof UsersTable, 'insert'>
