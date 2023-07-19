import { NextRequest, NextResponse } from 'next/server'
import { UserJSON, WebhookEvent } from '@clerk/nextjs/dist/types/server'

import { addUser, editUser } from '@/db/users/actions'

export async function POST(req: NextRequest) {
  const event = (await req.json()) as WebhookEvent

  switch (event.type) {
    case 'user.created':
      createUser(event.data)
    case 'user.updated':
      updateUser(event.data)
  }

  return NextResponse.json({ success: true, data: event.type })
}

function createUser(data: UserJSON) {
  const newUser = {
    short_id: data.id,
    last_name: data.last_name,
    first_name: data.first_name,
    image_url: data.image_url,
    username: data.username,
    created_at: new Date(data.created_at),
  }
  addUser(newUser)
}

function updateUser(data: UserJSON) {
  const userId = data.id
  const updatedUser = {
    short_id: data.id,
    last_name: data.last_name,
    first_name: data.first_name,
    image_url: data.image_url,
    username: data.username,
    updated_at: new Date(data.updated_at),
  }
  editUser(userId, updatedUser)
}
