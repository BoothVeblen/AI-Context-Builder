import 'server-only'

import { redirect } from 'next/navigation'
import { and, asc, desc, eq } from 'drizzle-orm'

import { auth } from '@/lib/auth'
import { db } from '@/lib/drizzle-edge'

import { AppsTable } from '../apps/schema'
import { SessionsTable } from '../sessions/schema'
import { Message, MessagesTable, NewMessage } from './schema'

export async function getMessages(sessionId: string) {
  try {
    const { userId } = auth()
    if (!userId) {
      throw new Error('Not authenticated')
    }

    const sq = db
      .select({
        short_id: MessagesTable.short_id,
        session_id: MessagesTable.session_id,
        created_at: MessagesTable.created_at,
        type: MessagesTable.type,
        query: MessagesTable.query,
        answer: MessagesTable.answer,
        feedback: MessagesTable.feedback,
        content: MessagesTable.content,
        event_type: MessagesTable.event_type,
        call_duration: MessagesTable.call_duration,
        // do not include `raw` data, it will cause neon error when the raw size is too big
      })
      .from(MessagesTable)
      .where(
        and(
          eq(MessagesTable.session_id, sessionId),
          eq(MessagesTable.archived, false)
        )
      )
      .orderBy(desc(MessagesTable.created_at))
      .limit(100) // FIXME: pagination
      .as('sq')
    return db.select().from(sq).orderBy(asc(sq.created_at))
  } catch (error) {
    redirect('/')
  }
}

export async function addMessage(message: NewMessage) {
  try {
    const [newMessage] = await db
      .insert(MessagesTable)
      .values({ ...message, created_at: new Date() })
      .returning()
    return newMessage
  } catch (error: any) {
    throw new Error(error.message)
  }
}

export async function editMessage(
  messageId: string,
  newValues: Partial<Message>
) {
  try {
    const [found] = await db
      .select()
      .from(MessagesTable)
      .where(eq(MessagesTable.short_id, messageId))
    if (!found) throw new Error('Message not found')

    await db
      .update(MessagesTable)
      .set({ ...newValues, updated_at: new Date() })
      .where(eq(MessagesTable.short_id, messageId))
  } catch (error: any) {
    throw new Error(error.message)
  }
}

export async function removeMessage(id: string) {
  try {
    const [found] = await db
      .select()
      .from(MessagesTable)
      .where(eq(MessagesTable.short_id, id))
    if (!found) throw new Error('Message not found')

    await db
      .update(MessagesTable)
      .set({ archived: true, updated_at: new Date() })
      .where(eq(MessagesTable.short_id, id))
  } catch (error: any) {
    throw new Error(error.message)
  }
}

export async function addFeedback({
  messageId,
  feedback,
  content,
}: {
  messageId: string
  feedback: 'good' | 'bad'
  content?: string
}) {
  try {
    const [found] = await db
      .select()
      .from(MessagesTable)
      .where(eq(MessagesTable.short_id, messageId))
    if (!found) throw new Error('Message not found')

    const value = {
      feedback,
      feedback_content: content,
    }

    await db
      .update(MessagesTable)
      .set(value)
      .where(eq(MessagesTable.short_id, messageId))
  } catch (error: any) {
    return {
      error: error.message,
    }
  }
}

export async function addAnnotation({
  messageId,
  annotation,
}: {
  messageId: string
  annotation: string
}) {
  try {
    const [found] = await db
      .select()
      .from(AppsTable)
      .innerJoin(SessionsTable, eq(AppsTable.short_id, SessionsTable.app_id))
      .innerJoin(
        MessagesTable,
        eq(SessionsTable.short_id, MessagesTable.session_id)
      )
      .where(eq(MessagesTable.short_id, messageId))

    if (!found) throw new Error('Message not found')

    const value = {
      annotation,
    }

    await db
      .update(MessagesTable)
      .set(value)
      .where(eq(MessagesTable.short_id, messageId))
  } catch (error: any) {
    return {
      error: error.message,
    }
  }
}

export async function getFormattedMessages(sessionId: string) {
  const sq = await db
    .select({
      query: MessagesTable.query,
      answer: MessagesTable.answer,
      created_at: MessagesTable.created_at,
    })
    .from(MessagesTable)
    .where(
      and(
        eq(MessagesTable.session_id, sessionId),
        eq(MessagesTable.archived, false)
      )
    )
    .orderBy(desc(MessagesTable.created_at))
    .limit(10)
    .as('sq')
  const messages = await db.select().from(sq).orderBy(asc(sq.created_at))

  const formattedMessages = []
  for (const message of messages) {
    if (message.query)
      formattedMessages.push({ role: 'user', content: message.query })
    if (message.answer)
      formattedMessages.push({ role: 'assistant', content: message.answer })
  }

  return formattedMessages
}
