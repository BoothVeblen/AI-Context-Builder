import 'server-only'

import { revalidateTag, unstable_cache } from 'next/cache'
import { redirect } from 'next/navigation'
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
  await revalidateTag(`/user/${userId}/apps`)

  return { appId, sessionId: newSession[0]?.short_id }
}

export async function getApps() {
  const { userId } = auth()

  return await unstable_cache(
    async () => {
      try {
        if (!userId) {
          throw new Error('Not authenticated')
        }

        return db
          .select()
          .from(AppsTable)
          .orderBy(desc(AppsTable.created_at))
          .where(
            and(eq(AppsTable.created_by, userId), eq(AppsTable.archived, false))
          )
      } catch (error) {
        redirect('/')
      }
    },
    [`/user/${userId}/apps`],
    {
      revalidate: 15 * 60,
      tags: [`/user/${userId}/apps`],
    }
  )()
}

export async function getApp(appId: string) {
  return await unstable_cache(
    async () => {
      try {
        const items = await db
          .select()
          .from(AppsTable)
          .where(eq(AppsTable.short_id, appId))

        const appDetail = items[0]
        if (!appDetail) {
          throw new Error('App not found')
        }

        return appDetail
      } catch (error) {
        redirect('/')
      }
    },
    [`/app/${appId}`],
    {
      revalidate: 15 * 60, // revalidate in 15 minutes
      tags: [`/app/${appId}`],
    }
  )()
}

export async function editApp(id: string, newValue: Partial<NewApp>) {
  try {
    const { userId } = auth()
    if (!userId) {
      return {
        error: 'Not authenticated',
      }
    }

    const response = await db
      .update(AppsTable)
      .set(newValue)
      .where(and(eq(AppsTable.short_id, id), eq(AppsTable.created_by, userId)))

    await revalidateTag(`/app/${id}`)
    await revalidateTag(`/user/${userId}/apps`)

    return response
  } catch (error: any) {
    return {
      error: error.message,
    }
  }
}

export async function removeApp(id: string) {
  try {
    const { userId } = auth()
    if (!userId) {
      return {
        error: 'Not authenticated',
      }
    }

    const response = await db
      .update(AppsTable)
      .set({ archived: true, updated_at: new Date() })
      .where(and(eq(AppsTable.short_id, id), eq(AppsTable.created_by, userId)))

    await revalidateTag(`/user/${userId}/apps`)

    return response
  } catch (error: any) {
    return {
      error: error.message,
    }
  }
}
