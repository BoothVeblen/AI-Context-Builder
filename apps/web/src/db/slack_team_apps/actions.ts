import 'server-only'

import { and, eq } from 'drizzle-orm'

import { auth } from '@/lib/auth'
import { db } from '@/lib/drizzle-edge'
import { nanoid } from '@/lib/utils'

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
