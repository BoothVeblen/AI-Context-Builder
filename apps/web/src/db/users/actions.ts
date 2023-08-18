import 'server-only'

import { eq } from 'drizzle-orm'

import { db } from '@/lib/drizzle-edge'
import { serverLog } from '@/lib/posthog'

import { NewUser, UsersTable } from './schema'

export async function addUser(user: NewUser) {
  try {
    const response = await db.insert(UsersTable).values(user).returning()
    serverLog.capture({
      distinctId: 'clerk_webhook',
      event: 'success:add_user',
      properties: {
        user_id: response?.[0]?.short_id,
        value: response?.[0],
      },
    })
    return { response }
  } catch (error: any) {
    serverLog.capture({
      distinctId: 'clerk_webhook',
      event: 'error:add_user',
    })
    return {
      error: error.message,
    }
  }
}

export async function editUser(id: string, newValue: Partial<NewUser>) {
  try {
    const response = await db
      .update(UsersTable)
      .set(newValue)
      .where(eq(UsersTable.short_id, id))
      .returning()
    serverLog.capture({
      distinctId: 'clerk_webhook',
      event: 'success:edit_user',
      properties: {
        user_id: id,
        value: newValue,
      },
    })
    return { response }
  } catch (error: any) {
    serverLog.capture({
      distinctId: 'clerk_webhook',
      event: 'error:edit_user',
      properties: {
        user_id: id,
        value: newValue,
      },
    })
    return {
      error: error.message,
    }
  }
}
