import 'server-only'

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
  return db
    .select()
    .from(SessionsTable)
    .orderBy(desc(SessionsTable.created_at))
    .where(
      and(eq(SessionsTable.app_id, appId), eq(SessionsTable.archived, false))
    )
}

export async function removeSession(appId: string, sessionId: string) {
  const { userId } = auth()
  if (!userId) return null

  const foundSession = await db
    .select()
    .from(SessionsTable)
    .where(eq(SessionsTable.short_id, sessionId))
  if (!foundSession?.[0]) return null
  if (foundSession[0].app_id !== appId) return null

  const foundApp = await db
    .select()
    .from(AppsTable)
    .where(eq(AppsTable.short_id, foundSession[0].app_id))
  if (!foundApp?.[0]) return null
  if (foundApp[0].created_by !== userId) return null

  // await db.delete(SessionsTable).where(eq(SessionsTable.short_id, sessionId))
  await db
    .update(SessionsTable)
    .set({ archived: true, updated_at: new Date() })
    .where(eq(SessionsTable.short_id, sessionId))

  const latestSession = await db
    .select()
    .from(SessionsTable)
    .where(
      and(eq(SessionsTable.created_by, userId), eq(SessionsTable.app_id, appId))
    )
    .orderBy(desc(SessionsTable.created_at))
    .limit(1)

  return { deletedId: sessionId, latestId: latestSession[0]?.short_id }
}

export async function getLatestSessionId(appId: string) {
  const foundApp = await db
    .select()
    .from(AppsTable)
    .where(eq(AppsTable.short_id, appId))
  if (!foundApp?.[0]) return null

  const foundSession = await db
    .select()
    .from(SessionsTable)
    .where(
      and(eq(SessionsTable.app_id, appId), eq(SessionsTable.archived, false))
    )
    .orderBy(desc(SessionsTable.created_at))
    .limit(1)
  if (!foundSession?.[0]) return null

  return foundSession[0].short_id
}

export async function getSession(sessionId: string) {
  const items = await db
    .select()
    .from(SessionsTable)
    .where(eq(SessionsTable.short_id, sessionId))
  return Promise.resolve(items[0])
}
