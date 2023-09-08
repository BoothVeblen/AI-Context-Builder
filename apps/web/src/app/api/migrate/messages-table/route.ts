import { NextRequest, NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import pLimit from 'p-limit'

import { db } from '@/lib/drizzle-edge'
import { safeParse } from '@/lib/utils'
import { MessagesTable, NewMessage } from '@/db/messages/schema'
import { SessionsTable } from '@/db/sessions/schema'
import { ChatMessage, EventMessage } from '@/components/chat/types'

export const runtime = 'edge'
export const preferredRegion = 'pdx1' // us-west-2

const limit = pLimit(30)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const secret = searchParams.get('secret')
  if (secret == null || secret !== process.env.SECRET) {
    return NextResponse.json({ success: true })
  }

  const sessions = await db.select().from(SessionsTable)

  let allChatMessages: Record<string, Partial<NewMessage>[]> = {}
  let allEventMessages: Record<string, Partial<NewMessage>[]> = {}

  for (const session of sessions) {
    const { messages_str, events_str } = session
    const oldMessages = safeParse(messages_str, []).filter(
      Boolean
    ) as ChatMessage[]
    const newMessages: Partial<NewMessage>[] = []
    for (const oldMessage of oldMessages) {
      if (oldMessage.role === 'user') {
        newMessages.push({
          query: oldMessage.content,
        })
      } else if (oldMessage.role === 'assistant') {
        if (oldMessage.id) {
          newMessages[newMessages.length - 1] = {
            ...newMessages[newMessages.length - 1],
            type: 'chat',
            short_id: oldMessage.id,
            session_id: session.short_id,
            answer: oldMessage.content,
            created_at:
              typeof oldMessage.createdAt === 'number'
                ? new Date(oldMessage.createdAt)
                : new Date(),
            updated_at:
              typeof oldMessage.createdAt === 'number'
                ? new Date(oldMessage.createdAt)
                : new Date(),
            feedback: oldMessage.feedback ?? null,
            feedback_content: oldMessage.feedback_content ?? null,
            latency: oldMessage.meta?.latency ?? null,
            total_tokens: oldMessage.meta?.token?.total_tokens ?? null,
            raw: oldMessage.meta?.raw ?? null,
          }
        }
      }
    }
    if (newMessages.length > 0) {
      allChatMessages[session.short_id] = newMessages
    }

    const oldEvents = safeParse(events_str, []).filter(
      Boolean
    ) as EventMessage[]
    const newEvent: Partial<NewMessage>[] = []
    for (const oldEvent of oldEvents) {
      if (
        oldEvent.id &&
        // @ts-ignore
        !oldEvent.link &&
        oldEvent.eventType !== 'call.created'
      ) {
        newEvent.push({
          type: 'event',
          short_id: oldEvent.id,
          session_id: session.short_id,
          event_type: oldEvent.eventType || 'basic.opening_remarks',
          content: oldEvent.content ?? null,
          // @ts-ignore
          call_duration: oldEvent.duration ?? null,
          created_at:
            typeof oldEvent.createdAt === 'number'
              ? new Date(oldEvent.createdAt)
              : new Date(),
          updated_at:
            typeof oldEvent.createdAt === 'number'
              ? new Date(oldEvent.createdAt)
              : new Date(),
        })
      }
    }
    if (newEvent.length > 0) {
      allEventMessages[session.short_id] = newEvent
    }
  }

  const queue = []

  for (const [session_id, messages] of Object.entries(allChatMessages)) {
    for (const message of messages) {
      const task = limit(async () => {
        console.log('add message:', session_id, message.short_id)
        if (message.short_id) {
          const [found] = await db
            .select()
            .from(MessagesTable)
            .where(eq(MessagesTable.short_id, message.short_id))
          if (found) {
            return db
              .update(MessagesTable)
              .set(message)
              .where(eq(MessagesTable.short_id, message.short_id))
          }
          // @ts-ignore
          return db.insert(MessagesTable).values(message)
        }
      })
      queue.push(task)
    }
  }

  for (const [session_id, messages] of Object.entries(allEventMessages)) {
    for (const message of messages) {
      const task = limit(async () => {
        console.log('add event:', session_id, message.short_id)
        if (message.short_id) {
          const [found] = await db
            .select()
            .from(MessagesTable)
            .where(eq(MessagesTable.short_id, message.short_id))
          if (found) {
            return db
              .update(MessagesTable)
              .set(message)
              .where(eq(MessagesTable.short_id, message.short_id))
          }
          // @ts-ignore
          return db.insert(MessagesTable).values(message)
        }
      })
      queue.push(task)
    }
  }

  try {
    await Promise.allSettled(queue)

    const data = {
      allChatMessages,
      allEventMessages,
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
