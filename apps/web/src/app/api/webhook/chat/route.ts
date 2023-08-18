import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'

import { db } from '@/lib/drizzle-edge'
import { initPusher } from '@/lib/pusher-server'
import { safeParse } from '@/lib/utils'
import { DatasetsTable } from '@/db/datasets/schema'
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
        console.log('webhook chat error:', event)
      }
    }

    return NextResponse.json({ success: true, data: event.type })
  } catch (error: any) {
    console.log('webhook chat error:', error.message)
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
}

async function updateDataset(data: any) {
  const { api_dataset_id, status } = data
  await db
    .update(DatasetsTable)
    .set({ status })
    .where(eq(DatasetsTable.api_dataset_id, api_dataset_id))
}
