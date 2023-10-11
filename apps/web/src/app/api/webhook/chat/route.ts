import { NextRequest, NextResponse } from 'next/server'
import { and, eq, inArray, isNotNull } from 'drizzle-orm'
import { nanoid } from 'nanoid'

import { db } from '@/lib/drizzle-edge'
import { logsnag } from '@/lib/logsnag'
import { initPusher } from '@/lib/pusher-server'
import { formatSeconds } from '@/lib/utils'
import { AppsTable } from '@/db/apps/schema'
import { DatasetsTable } from '@/db/datasets/schema'
import { DocumentsTable } from '@/db/documents/schema'
import { addMessage } from '@/db/messages/actions'
import { MessagesTable } from '@/db/messages/schema'
import { formatEventMessage } from '@/db/messages/utils'
import { SessionsTable } from '@/db/sessions/schema'
import { UsersTable } from '@/db/users/schema'
import { DataProps } from '@/app/dataset/type'

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
      case 'document.update': {
        await updateDocument(event.data)
        break
      }
      case 'annotations.get': {
        const data = await getAnnotations(event.data)
        return NextResponse.json({ success: true, data })
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

  const user = await getUserBySessionId(session.short_id)
  await logsnag?.track({
    ...(user?.short_id ? { user_id: user?.short_id } : {}),
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
    call_duration: duration,
    createdAt: Date.now(),
  }

  const channelId = formatChannelId(session.short_id)
  const pusher = initPusher()
  await pusher?.trigger(channelId, 'user-chat', newEvent)

  const message = formatEventMessage({
    short_id: newEvent.id,
    session_id: session.short_id,
    event_type: newEvent.eventType,
    call_duration: newEvent.call_duration,
  })
  await addMessage(message)

  const user = await getUserBySessionId(session.short_id)
  await logsnag?.track({
    ...(user?.short_id ? { user_id: user?.short_id } : {}),
    channel: 'chat',
    event: 'Call Ended',
    icon: '🔚',
    description: `${
      user?.email || `Session ${session.short_id}`
    } ended a call that lasted for ${formatSeconds(
      +(message.call_duration || 0)
    )}`,
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

async function getAnnotations(data: { api_model_ids: string[] }) {
  const { api_model_ids = [] } = data
  const result = await db
    .select({
      Human: MessagesTable.query,
      AI: MessagesTable.answer,
      Annotation: MessagesTable.annotation,
    })
    .from(MessagesTable)
    .leftJoin(
      SessionsTable,
      eq(SessionsTable.short_id, MessagesTable.session_id)
    )
    .leftJoin(AppsTable, eq(AppsTable.short_id, SessionsTable.app_id))
    .where(
      and(
        inArray(AppsTable.api_model_id, api_model_ids),
        isNotNull(MessagesTable.annotation)
      )
    )
    .groupBy(MessagesTable.id, SessionsTable.id, AppsTable.id)
  return result
}

async function updateDocument(data: any) {
  const { api_dataset_id, document_status, document_id, document_characters } =
    data
  const [dataset_id] = await db
    .select({ dataset_id: DatasetsTable.short_id })
    .from(DatasetsTable)
    .where(eq(DatasetsTable.api_dataset_id, api_dataset_id))

  await db
    .update(DocumentsTable)
    .set({ status: document_status, characters: document_characters })
    .where(
      and(
        eq(DocumentsTable.uid, document_id),
        eq(DocumentsTable.dataset_id, dataset_id?.dataset_id)
      )
    )
  return dataset_id
}
