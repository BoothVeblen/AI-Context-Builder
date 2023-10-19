import { clerkClient } from '@clerk/nextjs'
import {
  ChatPostMessageArguments,
  ChatUpdateArguments,
  WebClient,
} from '@slack/web-api'
import { and, desc, eq, sql } from 'drizzle-orm'
import { throttle } from 'lodash'

import { db } from '@/lib/drizzle-edge'
import { flags } from '@/lib/flags'
import { nanoid } from '@/lib/utils'
import { AppsTable } from '@/db/apps/schema'
import { addMessage } from '@/db/messages/actions'
import { formatEventMessage } from '@/db/messages/utils'
import { SessionsTable } from '@/db/sessions/schema'
import { SlackTeamAppsTable } from '@/db/slack_team_apps/schema'
import { NewSlackTeam, SlackTeamsTable } from '@/db/slack_teams/schema'
import {
  NewSlackUserApp,
  SlackUserApp,
  SlackUserAppsTable,
} from '@/db/slack_user_apps/schema'
import { SlackUser, SlackUsersTable } from '@/db/slack_users/schema'
import { UsersTable } from '@/db/users/schema'

export const createSlackClient = (token?: string) => new WebClient(token)

export const getAccessToken = async (app_id: string, team_id: string) => {
  const [item] = await db
    .select()
    .from(SlackTeamsTable)
    .where(
      and(
        eq(SlackTeamsTable.app_id, app_id),
        eq(SlackTeamsTable.team_id, team_id),
        eq(SlackTeamsTable.archived, false)
      )
    )
    .limit(1)

  return item?.access_token
}

export class SlackUtils {
  client: WebClient
  app_id: string
  team_id: string
  #access_token: string

  constructor() {
    this.client = createSlackClient()
    this.app_id = ''
    this.team_id = ''
    this.#access_token = ''
  }

  async initialize({
    app_id,
    team_id,
    access_token,
  }: {
    app_id?: string
    team_id?: string
    access_token?: string
  } = {}) {
    if (app_id) this.app_id = app_id
    if (team_id) this.team_id = team_id
    this.#access_token =
      access_token || (await getAccessToken(this.app_id, this.team_id))
    this.client = createSlackClient(this.#access_token)
  }

  async addOrUpdateTeam({
    team_name,
    team_url,
    team_icon,
    access_token,
    scope,
    archived,
  }: Omit<NewSlackTeam, 'short_id' | 'app_id' | 'team_id'>) {
    const [found] = await db
      .select()
      .from(SlackTeamsTable)
      .where(
        and(
          eq(SlackTeamsTable.app_id, this.app_id),
          eq(SlackTeamsTable.team_id, this.team_id)
        )
      )
    if (found) {
      const [updatedSlackTeam] = await db
        .update(SlackTeamsTable)
        .set({
          team_name,
          team_url,
          team_icon,
          access_token: access_token || this.#access_token,
          scope,
          archived,
        })
        .where(eq(SlackTeamsTable.short_id, found.short_id))
        .returning()
      return updatedSlackTeam
    } else {
      const [newSlackTeam] = await db
        .insert(SlackTeamsTable)
        .values({
          short_id: nanoid(),
          app_id: this.app_id,
          team_id: this.team_id,
          team_name,
          team_url,
          team_icon,
          access_token: access_token || this.#access_token,
          scope,
          archived,
        })
        .returning()
      return newSlackTeam
    }
  }

  async addOrUpdateUser(
    {
      user_id,
    }: {
      user_id: string
    },
    options: {
      shouldUpdate: boolean
    } = {
      shouldUpdate: true,
    }
  ): Promise<SlackUser> {
    const [found] = await db
      .select()
      .from(SlackUsersTable)
      .leftJoin(
        UsersTable,
        eq(UsersTable.short_id, SlackUsersTable.context_user_id)
      )
      .where(
        and(
          eq(SlackUsersTable.app_id, this.app_id),
          eq(SlackUsersTable.team_id, this.team_id),
          eq(SlackUsersTable.user_id, user_id),
          eq(SlackUsersTable.archived, false),
          eq(UsersTable.archived, false)
        )
      )
      .orderBy(desc(SlackUsersTable.created_at))
      .limit(1)
    if (found) {
      if (!options.shouldUpdate) return found.slack_users

      const user = await this.getUserInfo(user_id)
      const [updatedSlackUser] = await db
        .update(SlackUsersTable)
        .set({ is_admin: user?.is_admin })
        .where(
          and(
            eq(SlackUsersTable.app_id, this.app_id),
            eq(SlackUsersTable.team_id, this.team_id),
            eq(SlackUsersTable.user_id, user_id),
            eq(SlackUsersTable.archived, false)
          )
        )
        .returning()
      return updatedSlackUser
    } else {
      const user = await this.getUserInfo(user_id)
      const email = user?.profile?.email
      if (!email)
        throw new Error('email is undefined, add scope users:read.email')
      const [found] = await db
        .select()
        .from(UsersTable)
        .where(and(eq(UsersTable.email, email), eq(UsersTable.archived, false)))
      if (found) {
        const [newSlackUser] = await db
          .insert(SlackUsersTable)
          .values({
            short_id: nanoid(),
            app_id: this.app_id,
            team_id: this.team_id,
            user_id,
            context_user_id: found.short_id,
            is_admin: user.is_admin,
          })
          .returning()
        return newSlackUser
      } else {
        const clerkUser = await clerkClient.users.createUser({
          emailAddress: [email],
          firstName: user?.profile?.first_name,
          lastName: user?.profile?.last_name,
          skipPasswordChecks: true,
          skipPasswordRequirement: true,
        })
        await db
          .insert(UsersTable)
          .values({
            short_id: clerkUser.id,
            email,
          })
          .onConflictDoNothing({ target: UsersTable.short_id })
        const [newSlackUser] = await db
          .insert(SlackUsersTable)
          .values({
            short_id: nanoid(),
            app_id: this.app_id,
            team_id: this.team_id,
            user_id,
            context_user_id: clerkUser.id,
            is_admin: user.is_admin,
          })
          .returning()
        return newSlackUser
      }
    }
  }

  async getUserInfo(user_id: string) {
    const response = await this.client.users.info({
      user: user_id,
    })
    if (response.ok) {
      return response.user
    } else {
      throw new Error(response.error)
    }
  }

  async publishHomeViews({
    user_id,
    channel_id,
  }: {
    user_id: string
    channel_id: string
  }) {
    const linkedApps = await db
      .select({
        short_id: AppsTable.short_id,
        name: AppsTable.name,
        icon: AppsTable.icon,
        description: AppsTable.description,
      })
      .from(SlackTeamAppsTable)
      .leftJoin(
        AppsTable,
        eq(SlackTeamAppsTable.context_app_id, AppsTable.short_id)
      )
      .where(
        and(
          eq(SlackTeamAppsTable.app_id, this.app_id),
          eq(SlackTeamAppsTable.team_id, this.team_id)
        )
      )
    const appListBlocks = []
    for (const linkedApp of linkedApps) {
      const sections = [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${linkedApp.name}*\n${linkedApp.description ?? ''}`,
          },
          ...(linkedApp.icon && {
            accessory: {
              type: 'image',
              image_url: linkedApp.icon,
              alt_text: linkedApp.name,
            },
          }),
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'Chat',
                emoji: true,
              },
              value: JSON.stringify({
                channel_id,
                context_app_id: linkedApp.short_id,
              }),
              action_id: 'create_session',
            },
          ],
        },
        {
          type: 'divider',
        },
      ]
      appListBlocks.push(...sections)
    }
    await this.client.views.publish({
      user_id,
      view: {
        type: 'home',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*Select an App to chat*',
            },
          },
          {
            type: 'divider',
          },
          ...appListBlocks,
        ],
      },
    })
  }

  async createSession(context_user_id: string, context_app_id: string) {
    const [foundApp] = await db
      .select()
      .from(AppsTable)
      .where(eq(AppsTable.short_id, context_app_id))
      .limit(1)
    if (!foundApp) {
      throw new Error('App not found')
    }

    let api_session_id = null
    if (flags.enabledAIService) {
      const res = await fetch(
        `${process.env.AI_SERVICE_API_BASE_URL}/v1/chat/session`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model_id: foundApp?.api_model_id,
          }),
        }
      )
      const json = await res.json()
      if (json.status !== 200) {
        throw new Error(`AI service error: ${json.message}`)
      }
      api_session_id = json?.data?.session_id
    }

    const [allSessions] = await db
      .select({ count: sql<number>`count(*)` })
      .from(SessionsTable)
      .where(
        and(
          eq(SessionsTable.app_id, context_app_id),
          eq(SessionsTable.created_by, context_user_id)
        )
      )
    const sessionCount = Number(allSessions?.count) || 0

    const sessionVal = {
      short_id: nanoid(),
      name: `Chat ${sessionCount + 1}`,
      app_id: context_app_id,
      api_session_id,
      created_by: context_user_id,
    }
    const [newSession] = await db
      .insert(SessionsTable)
      .values(sessionVal)
      .returning()

    if (foundApp.opening_remarks) {
      const message = formatEventMessage({
        session_id: newSession.short_id,
        event_type: 'basic.opening_remarks',
        content: foundApp.opening_remarks,
      })
      await addMessage(message)
    }

    return {
      app: foundApp,
      session: newSession,
    }
  }

  async addOrUpdateUserApp({
    user_id,
    context_app_id,
    context_session_id,
  }: Omit<
    NewSlackUserApp,
    'short_id' | 'app_id' | 'team_id'
  >): Promise<SlackUserApp> {
    const [found] = await db
      .select()
      .from(SlackUserAppsTable)
      .where(
        and(
          eq(SlackUserAppsTable.app_id, this.app_id),
          eq(SlackUserAppsTable.team_id, this.team_id),
          eq(SlackUserAppsTable.user_id, user_id)
        )
      )
    if (found) {
      const [updatedSlackUserApp] = await db
        .update(SlackUserAppsTable)
        .set({
          context_app_id,
          context_session_id,
          updated_at: new Date(),
        })
        .where(eq(SlackUserAppsTable.short_id, found.short_id))
        .returning()
      return updatedSlackUserApp
    } else {
      const [newSlackUserApp] = await db
        .insert(SlackUserAppsTable)
        .values({
          short_id: nanoid(),
          app_id: this.app_id,
          team_id: this.team_id,
          user_id,
          context_app_id,
          context_session_id,
        })
        .returning()
      return newSlackUserApp
    }
  }

  postMessage({ channel, text }: ChatPostMessageArguments) {
    return this.client.chat.postMessage({
      channel,
      text,
    })
  }

  updateMessage = throttle(
    async ({ channel, ts, text, blocks }: ChatUpdateArguments) => {
      return this.client.chat.update({
        channel,
        ts,
        text,
        blocks,
      })
    },
    200
  )

  async getCurrentSession(user_id: string) {
    const [currentSession] = await db
      .select({
        session_id: SessionsTable.short_id,
        api_session_id: SessionsTable.api_session_id,
        slack_team_app_id: SlackTeamAppsTable.short_id,
      })
      .from(SlackUserAppsTable)
      .leftJoin(
        SessionsTable,
        eq(SessionsTable.short_id, SlackUserAppsTable.context_session_id)
      )
      .leftJoin(
        SlackTeamAppsTable,
        and(
          eq(SlackTeamAppsTable.app_id, this.app_id),
          eq(SlackTeamAppsTable.team_id, this.team_id),
          eq(
            SlackTeamAppsTable.context_app_id,
            SlackUserAppsTable.context_app_id
          )
        )
      )
      .where(
        and(
          eq(SlackUserAppsTable.app_id, this.app_id),
          eq(SlackUserAppsTable.team_id, this.team_id),
          eq(SlackUserAppsTable.user_id, user_id),
          eq(SessionsTable.archived, false)
        )
      )
      .orderBy(desc(SlackUserAppsTable.updated_at))
      .limit(1)
    return currentSession
  }
}
