import 'server-only'

import { redirect } from 'next/navigation'
import { Message } from 'ai'
import axios from 'axios'
import { and, desc, eq, sql } from 'drizzle-orm'

import { auth } from '@/lib/auth'
import { db } from '@/lib/drizzle-edge'
import { flags } from '@/lib/flags'
import { serverLog } from '@/lib/posthog'
import { nanoid } from '@/lib/utils'

import { AppsTable } from '../apps/schema'
import { SessionsTable } from './schema'

export async function addSession(appId: string) {
  const { userId } = auth()
  if (!userId) {
    throw new Error('Not authenticated')
  }

  const [foundApp] = await db
    .select()
    .from(AppsTable)
    .where(eq(AppsTable.short_id, appId))
    .limit(1)
  if (!foundApp) {
    throw new Error('App not found')
  }

  let api_session_id = null
  if (flags.enabledAIService) {
    let { data: res } = await axios.post(
      `${process.env.AI_SERVICE_API_BASE_URL}/v1/chat/session`,
      { model_id: foundApp?.api_model_id }
    )
    if (res.status !== 200) {
      serverLog.capture({
        distinctId: userId,
        event: 'ai_service_error:add_session',
        properties: {
          message: res.message,
          app_id: appId,
        },
      })
      throw new Error(`AI service error: ${res.message}`)
    }
    api_session_id = res?.data?.session_id
  }

  const allSessions = await db
    .select({ count: sql<number>`count(*)` })
    .from(SessionsTable)
    .where(
      and(eq(SessionsTable.app_id, appId), eq(SessionsTable.created_by, userId))
    )
  const sessionCount = Number(allSessions[0]?.count) || 0

  let eventMessageContent = null
  if (foundApp.opening_remarks) {
    eventMessageContent = foundApp.opening_remarks
  }
  if (foundApp.enable_video_interaction) {
    eventMessageContent = null
  }
  const sessionVal = {
    short_id: nanoid(),
    name: `Chat ${sessionCount + 1}`,
    app_id: appId,
    api_session_id,
    created_by: userId,
    events_str: eventMessageContent
      ? JSON.stringify([
          {
            type: 'event',
            data: {
              id: nanoid(),
              role: 'assistant',
              content: eventMessageContent,
              createdAt: Date.now(),
            },
          },
        ])
      : null,
  }
  const newSession = await db
    .insert(SessionsTable)
    .values(sessionVal)
    .returning()

  serverLog.capture({
    distinctId: userId,
    event: 'success:add_session',
    properties: {
      app_id: appId,
      session_id: newSession[0]?.short_id,
      api_session_id,
    },
  })

  return { sessionId: newSession[0]?.short_id }
}

export async function getSessions(appId: string) {
  try {
    const { userId } = auth()
    if (!userId) {
      throw new Error('Not authenticated')
    }

    return db
      .select()
      .from(SessionsTable)
      .orderBy(desc(SessionsTable.created_at))
      .where(
        and(
          eq(SessionsTable.app_id, appId),
          eq(SessionsTable.created_by, userId),
          eq(SessionsTable.archived, false)
        )
      )
  } catch (error) {
    redirect('/')
  }
}

export async function removeSession(appId: string, sessionId: string) {
  const { userId } = auth()
  if (!userId) return null

  const foundSession = await db
    .select()
    .from(SessionsTable)
    .where(
      and(
        eq(SessionsTable.short_id, sessionId),
        eq(SessionsTable.created_by, userId)
      )
    )
  if (!foundSession?.[0]) return null
  if (foundSession[0].app_id !== appId) return null

  // await db.delete(SessionsTable).where(eq(SessionsTable.short_id, sessionId))
  await db
    .update(SessionsTable)
    .set({ archived: true, updated_at: new Date() })
    .where(eq(SessionsTable.short_id, sessionId))

  serverLog.capture({
    distinctId: userId,
    event: 'success:remove_session',
    properties: {
      app_id: appId,
      session_id: sessionId,
    },
  })

  const latestSession = await db
    .select()
    .from(SessionsTable)
    .where(
      and(
        eq(SessionsTable.created_by, userId),
        eq(SessionsTable.app_id, appId),
        eq(SessionsTable.archived, false)
      )
    )
    .orderBy(desc(SessionsTable.created_at))
    .limit(1)

  return { deletedId: sessionId, latestId: latestSession[0]?.short_id }
}

export async function getLatestSessionId(appId: string) {
  try {
    const { userId } = auth()
    if (!userId) {
      throw new Error('Not authenticated')
    }

    const foundApp = await db
      .select()
      .from(AppsTable)
      .where(eq(AppsTable.short_id, appId))
    if (!foundApp?.[0]) {
      throw new Error('App not found')
    }

    const foundSession = await db
      .select()
      .from(SessionsTable)
      .where(
        and(
          eq(SessionsTable.created_by, userId),
          eq(SessionsTable.app_id, appId),
          eq(SessionsTable.archived, false)
        )
      )
      .orderBy(desc(SessionsTable.created_at))
      .limit(1)
    if (!foundSession?.[0]) {
      let api_session_id = null
      if (flags.enabledAIService) {
        let { data: res } = await axios.post(
          `${process.env.AI_SERVICE_API_BASE_URL}/v1/chat/session`,
          { model_id: foundApp?.[0]?.api_model_id }
        )
        if (res.status !== 200) {
          throw new Error(`AI service error: ${res.message}`)
        }
        api_session_id = res?.data?.session_id
      }

      const sessionVal = {
        short_id: nanoid(),
        name: 'Chat 1',
        app_id: appId,
        created_by: userId,
        api_session_id,
      }
      const newSession = await db
        .insert(SessionsTable)
        .values(sessionVal)
        .returning()
      return newSession[0].short_id
    }

    return foundSession[0].short_id
  } catch (error: any) {
    redirect('/')
  }
}

export async function getSession(sessionId: string, appId?: string) {
  try {
    const { userId } = auth()
    if (!userId) {
      throw new Error('Not authenticated')
    }

    const [session] = await db
      .select()
      .from(SessionsTable)
      .where(
        and(
          eq(SessionsTable.short_id, sessionId),
          eq(SessionsTable.created_by, userId),
          eq(SessionsTable.archived, false)
        )
      )
      .leftJoin(AppsTable, eq(SessionsTable.app_id, AppsTable.short_id))

    if (!session) {
      throw new Error('Session not found')
    }

    return {
      session: session.sessions,
      app: session.apps,
    }
  } catch (error: any) {
    if (appId) {
      redirect(`/app/${appId}`)
    }
    redirect('/')
  }
}

function formatId(message: Message) {
  if (!message.id) {
    return {
      ...message,
      id: nanoid(),
    }
  }
  return message
}

function formatTimestamp(message: Message) {
  if (typeof message.createdAt !== 'number') {
    return {
      ...message,
      createdAt: new Date(message.createdAt || Date.now()).getTime(),
    }
  }

  return message
}

export async function updateMessagesToSession(
  sessionId: string,
  messages: Message[]
) {
  const { userId } = auth()
  try {
    if (!userId) {
      throw new Error('Not authenticated')
    }

    const formattedMessages = messages.map(formatId).map(formatTimestamp)

    console.log(
      'BEGIN updateMessagesToSession db update:',
      userId,
      formattedMessages.length
    )
    await db
      .update(SessionsTable)
      .set({
        messages_str: JSON.stringify(formattedMessages),
      })
      .where(
        and(
          eq(SessionsTable.short_id, sessionId),
          eq(SessionsTable.created_by, userId)
        )
      )
    console.log('END updateMessagesToSession db update')

    serverLog.capture({
      distinctId: userId,
      event: 'success:update_messages_to_session',
      properties: {
        sessionId,
        messages,
      },
    })
  } catch (error: any) {
    console.error('updateMessagesToSession error:', error.message)

    if (userId) {
      serverLog.capture({
        distinctId: userId,
        event: 'error:update_messages_to_session',
        properties: {
          sessionId,
          messages,
          error: error.message,
        },
      })
    }

    return {
      error: error.message,
    }
  }
}
