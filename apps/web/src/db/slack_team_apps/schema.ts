import { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import { pgTable, serial, text, uniqueIndex } from 'drizzle-orm/pg-core'

import { AppsTable } from '../apps/schema'

export const SlackTeamAppsTable = pgTable(
  'slack_team_apps',
  {
    id: serial('id').primaryKey(),
    short_id: text('short_id').unique().notNull(),
    app_id: text('app_id').notNull(),
    team_id: text('team_id').notNull(),
    context_app_id: text('context_app_id')
      .references(() => AppsTable.short_id)
      .notNull(),
  },
  (slack_team_apps) => {
    return {
      unique_idx: uniqueIndex('unique_idx').on(
        slack_team_apps.app_id,
        slack_team_apps.team_id,
        slack_team_apps.context_app_id
      ),
    }
  }
)

export type SlackTeamApp = InferSelectModel<typeof SlackTeamAppsTable>
export type NewSlackTeamApp = InferInsertModel<typeof SlackTeamAppsTable>
