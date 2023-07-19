import { NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs'

import { auth } from '@/lib/auth'
import { addUser } from '@/db/users/actions'

export async function GET() {
  const { userId } = auth()
  if (!userId) {
    return NextResponse.redirect('/')
  }

  const totalUsers = await clerkClient.users.getCount()

  const users = await clerkClient.users.getUserList({
    orderBy: '-created_at',
    limit: totalUsers,
  })

  const userValues = users.map((user) => ({
    short_id: user.id,
    last_name: user.lastName,
    first_name: user.firstName,
    image_url: user.imageUrl,
    username: user.username,
    created_at: new Date(user.createdAt),
  }))

  userValues.forEach((user) => {
    addUser(user)
  })

  return NextResponse.json({ success: true, data: { totalUsers, userValues } })
}
