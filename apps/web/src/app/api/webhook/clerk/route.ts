import { NextRequest, NextResponse } from 'next/server'
import { UserJSON, WebhookEvent } from '@clerk/nextjs/dist/types/server'

import { addUser, editUser } from '@/db/users/actions'

export async function POST(req: NextRequest) {
  try {
    const event = (await req.json()) as WebhookEvent

    switch (event.type) {
      case 'user.created':
        await createUser(event.data)
      case 'user.updated':
        await updateUser(event.data)
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
  const newUser = {
    short_id: data.id,
    last_name: data.last_name,
    first_name: data.first_name,
    image_url: data.image_url,
    username: data.username,
    created_at: new Date(data.created_at),
  }
  const result = await addUser(newUser)
  if (result.error) {
    throw new Error(result.error)
  }
}

async function updateUser(data: UserJSON) {
  const userId = data.id
  const updatedUser = {
    short_id: data.id,
    last_name: data.last_name,
    first_name: data.first_name,
    image_url: data.image_url,
    username: data.username,
    updated_at: new Date(data.updated_at),
  }
  const result = await editUser(userId, updatedUser)
  if (result.error) {
    throw new Error(result.error)
  }
}
