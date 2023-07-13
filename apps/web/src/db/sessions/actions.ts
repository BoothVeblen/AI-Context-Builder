import 'server-only'

import { redirect } from 'next/navigation'
import { and, desc, eq, sql } from 'drizzle-orm'

import { auth } from '@/lib/auth'
import { db } from '@/lib/drizzle'
import { nanoid } from '@/lib/utils'

import { AppsTable } from '../apps/schema'
import { SessionsTable } from './schema'

export async function addSession(appId: string) {
  const { userId } = auth()
  if (!userId) return null

  const foundApp = await db
    .select()
    .from(AppsTable)
    .where(eq(AppsTable.short_id, appId))
  if (!foundApp?.[0]) return null

  const allSessions = await db
    .select({ count: sql<number>`count(*)` })
    .from(SessionsTable)
    .where(
      and(eq(SessionsTable.app_id, appId), eq(SessionsTable.created_by, userId))
    )
  const sessionCount = Number(allSessions[0]?.count) || 0

  const sessionVal = {
    short_id: nanoid(),
    name: `Chat ${sessionCount + 1}`,
    app_id: appId,
    created_by: userId,
  }
  const newSession = await db
    .insert(SessionsTable)
    .values(sessionVal)
    .returning()

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
      const sessionVal = {
        short_id: nanoid(),
        name: 'Chat 1',
        app_id: appId,
        created_by: userId,
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

export async function getSession(sessionId: string) {
  try {
    const { userId } = auth()
    if (!userId) {
      throw new Error('Not authenticated')
    }

    const items = await db
      .select()
      .from(SessionsTable)
      .where(
        and(
          eq(SessionsTable.short_id, sessionId),
          eq(SessionsTable.created_by, userId)
        )
      )
      .leftJoin(AppsTable, eq(SessionsTable.app_id, AppsTable.short_id))

    const sessionDetail = items[0]
    if (!sessionDetail) {
      throw new Error('Session not found')
    }

    return sessionDetail
  } catch (error: any) {
    redirect('/')
  }
}
