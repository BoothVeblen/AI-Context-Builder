import 'server-only'

import { redirect } from 'next/navigation'
import { and, asc, desc, eq } from 'drizzle-orm'

import { auth } from '@/lib/auth'
// why use pool at this action? see https://github.com/withcontext-ai/builder/pull/162
import { db } from '@/lib/drizzle-pool'

import { Message, MessagesTable, NewMessage } from './schema'

export async function getMessages(sessionId: string) {
  try {
    const { userId } = auth()
    if (!userId) {
      throw new Error('Not authenticated')
    }

    const sq = db
      .select()
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
