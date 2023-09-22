import 'server-only'

import { and, desc, eq } from 'drizzle-orm'

import { auth } from '@/lib/auth'
import { db } from '@/lib/drizzle-edge'

import { SlackUsersTable } from '../slack_users/schema'
import { SlackTeamsTable } from './schema'

export async function getMyTeamList() {
  try {
    const { userId } = auth()
    if (!userId) {
      throw new Error('Not authenticated')
    }

    const teamList = await db
      .select({
        app_id: SlackUsersTable.app_id,
        team_id: SlackTeamsTable.team_id,
        team_name: SlackTeamsTable.team_name,
        team_url: SlackTeamsTable.team_url,
        team_icon: SlackTeamsTable.team_icon,
      })
      .from(SlackUsersTable)
      .leftJoin(
        SlackTeamsTable,
        and(
          eq(SlackTeamsTable.app_id, SlackUsersTable.app_id),
          eq(SlackTeamsTable.team_id, SlackUsersTable.team_id)
        )
      )
      .where(
        and(
          eq(SlackUsersTable.context_user_id, userId),
          eq(SlackUsersTable.is_admin, true),
          eq(SlackUsersTable.archived, false)
        )
      )
      .orderBy(desc(SlackTeamsTable.created_at))

    return teamList
  } catch (error: any) {
    console.log('error:', error.message)
  }
}
