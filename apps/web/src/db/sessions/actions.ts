import 'server-only'

import { redirect } from 'next/navigation'
import {
  and,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  isNotNull,
  notInArray,
  or,
  SQL,
  sql,
} from 'drizzle-orm'

import { api } from '@/lib/api'
import { auth } from '@/lib/auth'
import { db } from '@/lib/drizzle-edge'
import { flags } from '@/lib/flags'
import { nanoid } from '@/lib/utils'

import { AppsTable } from '../apps/schema'
import { addMessage } from '../messages/actions'
import { MessagesTable } from '../messages/schema'
import { formatEventMessage } from '../messages/utils'
import { checkUserId } from '../users/actions'
import { UsersTable } from '../users/schema'
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
  if (flags.enabledAIService && foundApp?.api_model_id) {
    const data = await api.post<{ model_id: string }, { session_id: string }>(
      '/v1/chat/session',
      { model_id: foundApp?.api_model_id }
    )
    api_session_id = data?.session_id
  }

  const [allSessions] = await db
    .select({ count: sql<number>`count(*)` })
    .from(SessionsTable)
    .where(
      and(eq(SessionsTable.app_id, appId), eq(SessionsTable.created_by, userId))
    )
  const sessionCount = Number(allSessions?.count) || 0

  const sessionVal = {
    short_id: nanoid(),
    name: `Chat ${sessionCount + 1}`,
    app_id: appId,
    api_session_id,
    created_by: userId,
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
      if (flags.enabledAIService && foundApp?.api_model_id) {
        const data = await api.post<
          { model_id: string },
          { session_id: string }
        >('/v1/chat/session', { model_id: foundApp?.api_model_id })
        api_session_id = data?.session_id
      }
      const sessionVal = {
        short_id: nanoid(),
        name: 'Chat 1',
        app_id: appId,
        created_by: userId,
        api_session_id,
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

// TODO: select only the fields we need
export async function getPublicSession(sessionId: string) {
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
    redirect('/')
  }
}

const timeframes = {
  last7days: gte(SessionsTable.created_at, sql`now() - interval '7 days'`),
  last3months: gte(SessionsTable.created_at, sql`now() - interval '3 months'`),
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

const messageIdsHasFeedbackQuery = db
  .select({ data: MessagesTable.session_id })
  .from(MessagesTable)
  .where(isNotNull(MessagesTable.feedback))
const messageIdsHasAnnotationQuery = db
  .select({ data: MessagesTable.session_id })
  .from(MessagesTable)
  .where(isNotNull(MessagesTable.annotation))

const messageIdsSearchQueryBuilder = (search: string) =>
  db
    .select({ data: MessagesTable.session_id })
    .from(MessagesTable)
    .where(
      and(
        eq(MessagesTable.type, 'chat'),
        or(
          ilike(MessagesTable.query, `%${search}%`),
          ilike(MessagesTable.answer, `%${search}%`)
        )
      )
    )

const feedbacks = {
  userfeedback: inArray(SessionsTable.short_id, messageIdsHasFeedbackQuery),
  nofeedback: notInArray(SessionsTable.short_id, messageIdsHasFeedbackQuery),
  annotated: inArray(SessionsTable.short_id, messageIdsHasAnnotationQuery),
  notannotated: notInArray(
    SessionsTable.short_id,
    messageIdsHasAnnotationQuery
  ),
  all: null,
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
  const sessionFilters = [
    eq(SessionsTable.app_id, appId),
    timeframe && timeframes[timeframe as keyof typeof timeframes],
    feedback && feedbacks[feedback as keyof typeof feedbacks],
    search &&
      inArray(SessionsTable.short_id, messageIdsSearchQueryBuilder(search)),
  ].filter(Boolean) as SQL[]

  let sessionsQuery = db
    .select({
      id: SessionsTable.id,
      short_id: SessionsTable.short_id,
      created_at: SessionsTable.created_at,
      email: UsersTable.email,
      total: sql<number>`count(${MessagesTable.id})`,
      feedback: {
        good: sql<number>`count(${MessagesTable.feedback}) filter (where ${MessagesTable.feedback} = 'good')`,
        bad: sql<number>`count(${MessagesTable.feedback}) filter (where ${MessagesTable.feedback} = 'bad')`,
      },
    })
    .from(SessionsTable)
    .orderBy(desc(SessionsTable.created_at))
    .limit(pageSize)
    .offset(page * pageSize)
    .innerJoin(UsersTable, eq(SessionsTable.created_by, UsersTable.short_id))
    .leftJoin(
      MessagesTable,
      eq(SessionsTable.short_id, MessagesTable.session_id)
    )
    .where(and(...sessionFilters))
    .groupBy(
      SessionsTable.id,
      SessionsTable.short_id,
      SessionsTable.created_at,
      UsersTable.email
    )

  const sessionsCountQuery = db
    .select({
      feedbacks: sql<number>`count(distinct ${SessionsTable.short_id}) filter (where ${MessagesTable.feedback} is not null)`,
      annotations: sql<number>`count(distinct ${SessionsTable.short_id}) filter (where ${MessagesTable.annotation} <> '')`,
      count: sql<number>`count(distinct ${SessionsTable.short_id})`,
    })
    .from(SessionsTable)
    .leftJoin(
      MessagesTable,
      eq(SessionsTable.short_id, MessagesTable.session_id)
    )
    .where(and(...sessionFilters))

  const appQuery = db
    .select()
    .from(AppsTable)
    .where(eq(AppsTable.short_id, appId))

  const [sessions, [sessionsCount], [app]] = await Promise.all([
    sessionsQuery,
    sessionsCountQuery,
    appQuery,
  ])

  return { sessions, ...sessionsCount, app }
}
