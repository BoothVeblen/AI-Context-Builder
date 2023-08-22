import { NextRequest, NextResponse } from 'next/server'
import {
  DeletedObjectJSON,
  UserJSON,
  WebhookEvent,
} from '@clerk/nextjs/dist/types/server'

import { logsnag } from '@/lib/logsnag'
import { addUser, editUser, removeUser } from '@/db/users/actions'
import { formatUserJSON } from '@/db/users/utils'

export async function POST(req: NextRequest) {
  try {
    const event = (await req.json()) as WebhookEvent

    switch (event.type) {
      case 'user.created': {
        await createUser(event.data)
        break
      }
      case 'user.updated': {
        await updateUser(event.data)
        break
      }
      case 'user.deleted': {
        await deleteUser(event.data)
        break
      }
      default: {
        break
      }
    }

    return NextResponse.json({ success: true, data: event.type })
  } catch (error: any) {
    console.log('webhook clerk error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

async function createUser(data: UserJSON) {
  const newUser = formatUserJSON(data)
  const result = await addUser(newUser)
  if (result.error) {
    throw new Error(result.error)
  } else {
    await logsnag?.publish({
      channel: 'user',
      event: 'User Created',
      icon: '😀',
      description: `${newUser.email} created an account`,
      tags: {
        'user-id': newUser.short_id,
      },
    })
  }
}

async function updateUser(data: UserJSON) {
  const userId = data.id
  const updatedUser = formatUserJSON(data)
  const result = await editUser(userId, updatedUser)
  if (result.error) {
    throw new Error(result.error)
  } else {
    await logsnag?.publish({
      channel: 'user',
      event: 'User Updated',
      icon: '😀',
      description: `${updatedUser.email} updated his/her account`,
      tags: {
        'user-id': updatedUser.short_id,
      },
    })
  }
}

async function deleteUser(data: DeletedObjectJSON) {
  const { id, deleted } = data
  if (deleted && id) {
    const result = await removeUser(id)
    if (result.error) {
      throw new Error(result.error)
    } else {
      await logsnag?.publish({
        channel: 'user',
        event: 'User Removed',
        icon: '😀',
        description: `${result.user?.email} account has been removed`,
        tags: {
          'user-id': id,
        },
      })
    }
  }
}
