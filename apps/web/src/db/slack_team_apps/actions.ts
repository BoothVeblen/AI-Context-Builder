import 'server-only'

import { and, eq } from 'drizzle-orm'

import { auth } from '@/lib/auth'
import { db } from '@/lib/drizzle-edge'
import { logsnag } from '@/lib/logsnag'
import { nanoid } from '@/lib/utils'

import { AppsTable } from '../apps/schema'
import { SlackTeamsTable } from '../slack_teams/schema'
import { SlackTeamApp, SlackTeamAppsTable } from './schema'

export async function getLinkedTeamList(context_app_id: string) {
  try {
    const { userId } = auth()
    if (!userId) {
      throw new Error('Not authenticated')
    }

    const teamList = await db
      .select()
      .from(SlackTeamAppsTable)
      .where(eq(SlackTeamAppsTable.context_app_id, context_app_id))

    return teamList
  } catch (error: any) {
    console.log('error:', error.message)
  }
}

export async function linkTeamToApp(
  app_id: string,
  team_id: string,
  context_app_id: string
): Promise<SlackTeamApp> {
  const { userId } = auth()
  if (!userId) {
    throw new Error('Not authenticated')
  }
  const [found] = await db
    .select()
    .from(SlackTeamAppsTable)
    .where(
      and(
        eq(SlackTeamAppsTable.app_id, app_id),
        eq(SlackTeamAppsTable.team_id, team_id),
        eq(SlackTeamAppsTable.context_app_id, context_app_id)
      )
    )
    .limit(1)

  if (found) {
    return found
  } else {
    const [newSlackTeamApp] = await db
      .insert(SlackTeamAppsTable)
      .values({
        short_id: nanoid(),
        app_id,
        team_id,
        context_app_id,
      })
      .returning()

    const [logInfo] = await db
      .select({
        app_name: AppsTable.name,
        team_name: SlackTeamsTable.team_name,
      })
      .from(SlackTeamAppsTable)
      .leftJoin(
        AppsTable,
        eq(AppsTable.short_id, SlackTeamAppsTable.context_app_id)
      )
      .leftJoin(
        SlackTeamsTable,
        and(
          eq(SlackTeamsTable.app_id, SlackTeamAppsTable.app_id),
          eq(SlackTeamsTable.team_id, SlackTeamAppsTable.team_id)
        )
      )
      .where(eq(SlackTeamAppsTable.short_id, newSlackTeamApp.short_id))
    await logsnag?.track({
      user_id: userId,
      channel: 'share',
      event: 'Share app to Slack workspace',
      icon: '🔗',
      description: `Successfully shared ${logInfo.app_name} to ${logInfo.team_name}`,
      tags: {
        'slack-app-id': app_id,
        'slack-team-id': team_id,
      },
    })

    return newSlackTeamApp
  }
}

export async function unLinkTeamFromApp(
  app_id: string,
  team_id: string,
  context_app_id: string
): Promise<SlackTeamApp | undefined> {
  const [found] = await db
    .select()
    .from(SlackTeamAppsTable)
    .where(
      and(
        eq(SlackTeamAppsTable.app_id, app_id),
        eq(SlackTeamAppsTable.team_id, team_id),
        eq(SlackTeamAppsTable.context_app_id, context_app_id)
      )
    )
    .limit(1)

  if (found) {
    const [deletedTeamApp] = await db
      .delete(SlackTeamAppsTable)
      .where(
        and(
          eq(SlackTeamAppsTable.app_id, app_id),
          eq(SlackTeamAppsTable.team_id, team_id),
          eq(SlackTeamAppsTable.context_app_id, context_app_id)
        )
      )
      .returning()
    return deletedTeamApp
  }
}
