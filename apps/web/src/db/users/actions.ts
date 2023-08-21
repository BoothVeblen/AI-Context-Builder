import 'server-only'

import { UserJSON } from '@clerk/nextjs/dist/types/server'
import { eq } from 'drizzle-orm'

import { db } from '@/lib/drizzle-edge'

import { NewUser, UsersTable } from './schema'
import { formatUserJSON } from './utils'

const CLERK_API_BASE_URL = 'https://api.clerk.com/v1'

export async function addUser(user: NewUser) {
  try {
    const response = await db.insert(UsersTable).values(user).returning()
    return { response }
  } catch (error: any) {
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
    return { response }
  } catch (error: any) {
    return {
      error: error.message,
    }
  }
}

export async function checkUserId(id: string) {
  try {
    const [user] = await db
      .select({ short_id: UsersTable.short_id })
      .from(UsersTable)
      .where(eq(UsersTable.short_id, id))
    if (user.short_id === id) return true

    const res = await fetchUserInfoById(id)
    if (res.error) return false

    if (res.user) {
      const userInfo = formatUserJSON(res.user)
      await addUser(userInfo)
      return true
    }

    return false
  } catch (error: any) {
    console.log('checkUserId error:', error.message)
    return {
      error: error.message,
    }
  }
}

export async function fetchUserInfoById(id: string) {
  try {
    const user: UserJSON = await fetch(`${CLERK_API_BASE_URL}/users/${id}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
      },
    }).then((res) => res.json())

    return { user }
  } catch (error: any) {
    return {
      error: error.message,
    }
  }
}
