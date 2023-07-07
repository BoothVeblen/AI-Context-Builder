import 'server-only'

import { and, desc, eq } from 'drizzle-orm'

import { auth } from '@/lib/auth'
import { db } from '@/lib/drizzle'
import { nanoid } from '@/lib/utils'

import { SessionsTable } from '../sessions/schema'
import { addToWorkspace } from '../workspace/actions'
import { AppsTable, NewApp } from './schema'

export async function addApp(app: Omit<NewApp, 'short_id' | 'created_by'>) {
  const { userId } = auth()
  if (!userId) return null

  const appVal = { ...app, short_id: nanoid(), created_by: userId }
  const newApp = await db.insert(AppsTable).values(appVal).returning()

  const appId = newApp[0]?.short_id

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

  await addToWorkspace(appId)

  return { appId, sessionId: newSession[0]?.short_id }
}

export async function getApps() {
  const { userId } = auth()
  if (!userId) return Promise.resolve([])

  return db
    .select()
    .from(AppsTable)
    .orderBy(desc(AppsTable.created_at))
    .where(and(eq(AppsTable.created_by, userId), eq(AppsTable.archived, false)))
}

export async function getApp(appId: string) {
  const items = await db
    .select()
    .from(AppsTable)
    .where(eq(AppsTable.short_id, appId))
  return Promise.resolve(items[0])
}

export async function editApp(id: string, newValue: Partial<NewApp>) {
  const { userId } = auth()
  if (!userId) return Promise.resolve([])

  return db
    .update(AppsTable)
    .set(newValue)
    .where(and(eq(AppsTable.short_id, id), eq(AppsTable.created_by, userId)))
}

export async function removeApp(id: string) {
  const { userId } = auth()
  if (!userId) return Promise.resolve([])

  return db
    .update(AppsTable)
    .set({ archived: true, updated_at: new Date() })
    .where(and(eq(AppsTable.short_id, id), eq(AppsTable.created_by, userId)))
}
