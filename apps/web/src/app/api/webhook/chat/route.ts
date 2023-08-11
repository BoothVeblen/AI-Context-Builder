import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'

import { db } from '@/lib/drizzle-edge'
import { initPusher } from '@/lib/pusher-server'
import { safeParse } from '@/lib/utils'
import { Session, SessionsTable } from '@/db/sessions/schema'

async function getSession(api_session_id: string) {
  const [session] = await db
    .select()
    .from(SessionsTable)
    .where(eq(SessionsTable.api_session_id, api_session_id))
    .limit(1)

  return session
}

function formatChannelId(session_id: string) {
  return `session-${session_id}`
}

async function updateEvents(session: Session, newEvent: any) {
  const oldEvents = safeParse(session.events_str, [])
  const newEvents = [
    ...oldEvents,
    {
      type: 'event',
      data: newEvent,
    },
  ]

  await db
    .update(SessionsTable)
    .set({
      events_str: JSON.stringify(newEvents),
    })
    .where(eq(SessionsTable.short_id, session.short_id))
}

export async function POST(req: NextRequest) {
  try {
    const event = await req.json()

    switch (event.type) {
      case 'call.created': {
        await createCall(event.type, event.data)
        break
      }
      case 'call.ended': {
        await endCall(event.type, event.data)
        break
      }
      default: {
        console.log('webhook chat error:', event)
      }
    }

    return NextResponse.json({ success: true, data: event.type })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

async function createCall(type: string, data: any) {
  const { session_id: api_session_id, link } = data
  const session = await getSession(api_session_id)
  if (!session) return

  const newEvent = {
    id: nanoid(),
    type,
    link,
    createdAt: Date.now(),
  }

  const channelId = formatChannelId(session.short_id)
  const pusher = initPusher()
  pusher?.trigger(channelId, 'user-chat', {
    type: 'event',
    data: newEvent,
  })

  await updateEvents(session, newEvent)
}

async function endCall(type: string, data: any) {
  const { session_id: api_session_id, duration } = data
  const session = await getSession(api_session_id)
  if (!session) return

  const newEvent = {
    id: nanoid(),
    type,
    duration,
    createdAt: Date.now(),
  }

  const channelId = formatChannelId(session.short_id)
  const pusher = initPusher()
  pusher?.trigger(channelId, 'user-chat', {
    type: 'event',
    data: newEvent,
  })

  await updateEvents(session, newEvent)
}
