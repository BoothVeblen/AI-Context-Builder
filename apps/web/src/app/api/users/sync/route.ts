import { NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs'

import { auth } from '@/lib/auth'
import { editUser } from '@/db/users/actions'
import { formatUser } from '@/db/users/utils'

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

  const userValues = users.map(formatUser)

  const queue = []

  for (const user of userValues) {
    const task = editUser(user.short_id, user)
    queue.push(task)
  }

  await Promise.all(queue)

  return NextResponse.json({ success: true, data: { totalUsers, userValues } })
}
