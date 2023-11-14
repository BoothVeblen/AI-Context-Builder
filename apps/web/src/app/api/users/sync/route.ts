import { NextRequest, NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs'

import { logsnag } from '@/lib/logsnag'
import { formatUser } from '@/db/users/utils'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const secret = searchParams.get('secret')
    if (secret == null || secret !== process.env.SECRET) {
      return NextResponse.json({ success: true })
    }

    const totalUsers = await clerkClient.users.getCount()

    const users = await clerkClient.users.getUserList({
      orderBy: '-created_at',
      limit: totalUsers,
    })

    const userValues = users.map(formatUser)

    const queue = []

    for (const user of userValues) {
      // const task = editUser(user.short_id, user)
      const task = logsnag?.identify({
        user_id: user.short_id,
        properties: {
          ...(user.email ? { email: user.email } : {}),
          ...(user.last_name ? { 'last-name': user.last_name } : {}),
          ...(user.first_name ? { 'first-name': user.first_name } : {}),
        },
      })
      queue.push(task)
    }

    await Promise.allSettled(queue).then((values) => console.log(values))

    return NextResponse.json({
      success: true,
      data: { totalUsers, userValues },
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message })
  }
}
