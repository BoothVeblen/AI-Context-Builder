import { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import {
  boolean,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

export const SlackTeamsTable = pgTable(
  'slack_teams',
  {
    id: serial('id').primaryKey(),
    short_id: text('short_id').unique().notNull(),
    app_id: text('app_id').notNull(),
    team_id: text('team_id').notNull(),
    team_name: text('team_name').notNull(),
    team_url: text('team_url'),
    team_icon: text('team_icon'),
    access_token: text('access_token').notNull(),
    scope: text('scope'),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
    archived: boolean('archived').default(false).notNull(),
  },
  (slack_teams) => {
    return {
      unique_idx: uniqueIndex('unique_idx').on(
        slack_teams.app_id,
        slack_teams.team_id,
        slack_teams.archived
      ),
    }
  }
)

export type SlackTeam = InferSelectModel<typeof SlackTeamsTable>
export type NewSlackTeam = InferInsertModel<typeof SlackTeamsTable>
