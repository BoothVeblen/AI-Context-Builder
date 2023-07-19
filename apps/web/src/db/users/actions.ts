import 'server-only'

import { eq } from 'drizzle-orm'

import { db } from '@/lib/drizzle'

import { NewUser, UsersTable } from './schema'

export async function addUser(user: NewUser) {
  try {
    await db.insert(UsersTable).values(user)
  } catch (error: any) {
    console.log('addUser error:', error)
    return {
      error: error.message,
    }
  }
}

export async function editUser(id: string, newValue: Partial<NewUser>) {
  try {
    await db.update(UsersTable).set(newValue).where(eq(UsersTable.short_id, id))
  } catch (error: any) {
    console.log('editUser error:', error)
    return {
      error: error.message,
    }
  }
}
