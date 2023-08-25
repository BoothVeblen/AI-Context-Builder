import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'

import { db } from '@/lib/drizzle-edge'
import { logsnag } from '@/lib/logsnag'
import { initPusher } from '@/lib/pusher-server'
import { formatSeconds, safeParse } from '@/lib/utils'
import { DatasetsTable } from '@/db/datasets/schema'
import { Session, SessionsTable } from '@/db/sessions/schema'
import { UsersTable } from '@/db/users/schema'

async function getSession(api_session_id: string) {
  const [session] = await db
    .select()
    .from(SessionsTable)
    .where(eq(SessionsTable.api_session_id, api_session_id))
    .limit(1)

  return session
}

async function getUserBySessionId(sessionId: string) {
  const [user] = await db
    .select({ short_id: UsersTable.short_id, email: UsersTable.email })
    .from(SessionsTable)
    .where(eq(SessionsTable.short_id, sessionId))
    .leftJoin(UsersTable, eq(UsersTable.short_id, SessionsTable.created_by))

  return user
}

function formatChannelId(session_id: string) {
  return `session-${session_id}`
}

async function updateEvents(session: Session, newEvent: any) {
  const oldEvents = safeParse(session.events_str, [])
  const newEvents = [...oldEvents, newEvent]

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
      case 'dataset.updated': {
        await updateDataset(event.data)
        break
      }
      default: {
        throw new Error(`Unknown event type: ${event.type}`)
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

async function createCall(eventType: string, data: any) {
  const { session_id: api_session_id, link } = data
  const session = await getSession(api_session_id)
  if (!session) return

  const newEvent = {
    id: nanoid(),
    type: 'event',
    eventType,
    link,
    createdAt: Date.now(),
  }

  const channelId = formatChannelId(session.short_id)
  const pusher = initPusher()
  await pusher?.trigger(channelId, 'user-chat', newEvent)

  // DO NOT SAVE THIS TO DB
  // await updateEvents(session, newEvent)

  const user = await getUserBySessionId(session.short_id)
  await logsnag?.publish({
    channel: 'chat',
    event: 'Call Received',
    icon: '📞',
    description: `${
      user?.email || `Session ${session.short_id}`
    } received a call`,
    tags: {
      'session-id': session.short_id,
      'api-session-id': api_session_id,
      'user-id': user?.short_id || '',
    },
  })
}

async function endCall(eventType: string, data: any) {
  const { session_id: api_session_id, duration } = data
  const session = await getSession(api_session_id)
  if (!session) return

  const newEvent = {
    id: nanoid(),
    type: 'event',
    eventType,
    duration,
    createdAt: Date.now(),
  }

  const channelId = formatChannelId(session.short_id)
  const pusher = initPusher()
  await pusher?.trigger(channelId, 'user-chat', newEvent)

  await updateEvents(session, newEvent)

  const user = await getUserBySessionId(session.short_id)
  await logsnag?.publish({
    channel: 'chat',
    event: 'Call Ended',
    icon: '🔚',
    description: `${
      user?.email || `Session ${session.short_id}`
    } ended a call that lasted for ${formatSeconds(+data.duration || 0)}`,
    tags: {
      'session-id': session.short_id,
      'api-session-id': api_session_id,
      'user-id': user?.short_id || '',
    },
  })
}

async function updateDataset(data: any) {
  const { api_dataset_id, status } = data
  await db
    .update(DatasetsTable)
    .set({ status })
    .where(eq(DatasetsTable.api_dataset_id, api_dataset_id))
}
