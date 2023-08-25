import 'server-only'

import { redirect } from 'next/navigation'
import { Message } from 'ai'
import axios from 'axios'
import {
  and,
  desc,
  eq,
  gte,
  isNull,
  like,
  notLike,
  or,
  SQL,
  sql,
} from 'drizzle-orm'

import { auth } from '@/lib/auth'
import { db } from '@/lib/drizzle-edge'
import { flags } from '@/lib/flags'
import { nanoid, safeParse } from '@/lib/utils'
import { ChatMessage, EventMessage } from '@/components/chat/types'

import { AppsTable } from '../apps/schema'
import { checkUserId } from '../users/actions'
import { UsersTable } from '../users/schema'
import { Session, SessionsTable } from './schema'

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
      throw new Error(`AI service error: ${res.message}`)
    }
    api_session_id = res?.data?.session_id
  }

  const [allSessions] = await db
    .select({ count: sql<number>`count(*)` })
    .from(SessionsTable)
    .where(
      and(eq(SessionsTable.app_id, appId), eq(SessionsTable.created_by, userId))
    )
  const sessionCount = Number(allSessions?.count) || 0

  let eventMessageContent = null
  if (foundApp.opening_remarks) {
    eventMessageContent = foundApp.opening_remarks
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
            id: nanoid(),
            role: 'assistant',
            content: eventMessageContent,
            createdAt: Date.now(),
          },
        ])
      : null,
  }
  const [newSession] = await db
    .insert(SessionsTable)
    .values(sessionVal)
    .returning()

  return { sessionId: newSession.short_id }
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

  const [foundSession] = await db
    .select()
    .from(SessionsTable)
    .where(
      and(
        eq(SessionsTable.short_id, sessionId),
        eq(SessionsTable.created_by, userId)
      )
    )
  if (!foundSession) return null
  if (foundSession.app_id !== appId) return null

  // await db.delete(SessionsTable).where(eq(SessionsTable.short_id, sessionId))
  await db
    .update(SessionsTable)
    .set({ archived: true, updated_at: new Date() })
    .where(eq(SessionsTable.short_id, sessionId))

  const [latestSession] = await db
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

  return { deletedId: sessionId, latestId: latestSession?.short_id }
}

export async function getLatestSessionId(appId: string) {
  try {
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

    const [foundSession] = await db
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
    if (!foundSession) {
      const foundUser = await checkUserId(userId)
      if (!foundUser) {
        throw new Error('User not found')
      }

      let api_session_id = null
      if (flags.enabledAIService) {
        let { data: res } = await axios.post(
          `${process.env.AI_SERVICE_API_BASE_URL}/v1/chat/session`,
          { model_id: foundApp?.api_model_id }
        )
        if (res.status !== 200) {
          throw new Error(`AI service error: ${res.message}`)
        }
        api_session_id = res?.data?.session_id
      }
      let eventMessageContent = null
      if (foundApp.opening_remarks) {
        eventMessageContent = foundApp.opening_remarks
      }
      const sessionVal = {
        short_id: nanoid(),
        name: 'Chat 1',
        app_id: appId,
        created_by: userId,
        api_session_id,
        events_str: eventMessageContent
          ? JSON.stringify([
              {
                type: 'event',
                id: nanoid(),
                role: 'assistant',
                content: eventMessageContent,
                createdAt: Date.now(),
              },
            ])
          : null,
      }
      const [newSession] = await db
        .insert(SessionsTable)
        .values(sessionVal)
        .returning()
      return newSession.short_id
    }

    return foundSession.short_id
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
      .leftJoin(UsersTable, eq(SessionsTable.created_by, UsersTable.short_id))

    if (!session) {
      throw new Error('Session not found')
    }

    return {
      session: session.sessions,
      app: session.apps,
      user: session.users,
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
  messages: Message[],
  appId?: string
) {
  const { userId } = auth()
  try {
    if (!userId) {
      throw new Error('Not authenticated')
    }

    const [session] = await db
      .select()
      .from(SessionsTable)
      .where(eq(SessionsTable.short_id, sessionId))

    const currentMessages = safeParse(session.messages_str, [])

    const formattedMessages = messages.map(formatId).map(formatTimestamp)

    // todo impl single message chat
    const mergedMessages = formattedMessages.map((message, id) => {
      const currentMessage = currentMessages[id]
      if (currentMessage?.id === message.id) {
        return {
          ...message,
          ...currentMessage,
        }
      }
      return message
    })
    await db
      .update(SessionsTable)
      .set({
        messages_str: JSON.stringify(mergedMessages),
      })
      .where(
        and(
          eq(SessionsTable.short_id, sessionId),
          eq(SessionsTable.created_by, userId)
        )
      )
  } catch (error: any) {
    return {
      error: error.message,
    }
  }
}

export async function updateEvents(session: Session, newEvent: EventMessage) {
  const oldEvents = safeParse(session.events_str, [])
  const newEvents = [...oldEvents, newEvent].map(formatId).map(formatTimestamp)

  await db
    .update(SessionsTable)
    .set({
      events_str: JSON.stringify(newEvents),
    })
    .where(eq(SessionsTable.short_id, session.short_id))
}

export async function addFeedback({
  sessionId,
  messageId,
  feedback,
  content,
}: {
  sessionId: string
  messageId: string
  feedback: 'good' | 'bad'
  content?: string
}) {
  try {
    const [{ messages_str }] = await db
      .select()
      .from(SessionsTable)
      .where(eq(SessionsTable.short_id, sessionId))
    if (!messages_str) {
      return
    }

    const updatedMessage = JSON.parse(messages_str).map(
      (message: ChatMessage) => {
        if (message.id === messageId) {
          message.feedback = feedback
          message.feedback_content = content
        }
        return message
      }
    )

    await db
      .update(SessionsTable)
      .set({
        messages_str: JSON.stringify(updatedMessage),
      })
      .where(eq(SessionsTable.short_id, sessionId))
  } catch (error: any) {
    return {
      error: error.message,
    }
  }
}

export async function getMonitoringData({
  appId,
  pageSize = 10,
  page = 0,
  feedback,
  timeframe,
  search,
}: {
  appId: string
  pageSize?: number
  page?: number
  timeframe?: string
  feedback?: string
  search?: string
}) {
  const timeframes = {
    last7days: gte(SessionsTable.created_at, sql`now() - interval '7 days'`),
    last3months: gte(
      SessionsTable.created_at,
      sql`now() - interval '3 months'`
    ),
    last12months: gte(
      SessionsTable.created_at,
      sql`now() - interval '12 months'`
    ),
    monthtodate: gte(SessionsTable.created_at, sql`date_trunc('month', now())`),
    quartertodate: gte(
      SessionsTable.created_at,
      sql`date_trunc('quarter', now())`
    ),
    today: gte(SessionsTable.created_at, sql`date_trunc('day', now())`),
    yeartodate: gte(SessionsTable.created_at, sql`date_trunc('year', now())`),
  }

  const feedbacks = {
    userfeedback: like(SessionsTable.messages_str, `%feedback%`),
    nofeedback: or(
      isNull(SessionsTable.messages_str),
      notLike(SessionsTable.messages_str, `%feedback%`)
    ),
    all: null,
  }

  const query = [
    timeframe && timeframes[timeframe as keyof typeof timeframes],
    feedback && feedbacks[feedback as keyof typeof feedbacks],
    search && like(SessionsTable.messages_str, `%${search}%`),
  ].filter(Boolean) as SQL[]

  const start = Date.now()
  const [items, [count], [app]] = await Promise.all([
    db
      .select()
      .from(SessionsTable)
      .leftJoin(UsersTable, eq(SessionsTable.created_by, UsersTable.short_id))
      .where(and(eq(SessionsTable.app_id, appId), ...query))
      .limit(pageSize)
      .offset(page * pageSize),
    db
      .select({ count: sql<number>`count(*)` })
      .from(SessionsTable)
      .where(and(eq(SessionsTable.app_id, appId), ...query)),
    db.select().from(AppsTable).where(eq(AppsTable.short_id, appId)),
  ])

  console.log('getMonitoringData db query time:', Date.now() - start)

  const ret = {
    sessions: items.map((item) => {
      const messages = JSON.parse(
        item.sessions.messages_str || '[]'
      ) as ChatMessage[]

      const aggregation = messages.reduce(
        (acc, message) => {
          acc.total++
          if (message.feedback === 'good') {
            acc.feedback.good++
          }
          if (message.feedback === 'bad') {
            acc.feedback.bad++
          }
          return acc
        },
        {
          total: 0,
          feedback: {
            good: 0,
            bad: 0,
          },
        }
      )
      return {
        ...item.sessions,
        email: item.users?.email,
        first_name: item.users?.first_name,
        last_name: item.users?.last_name,
        image_url: item.users?.image_url,
        ...aggregation,
      }
    }),
    count: count?.count || 0,
    app,
  }
  return ret
}
