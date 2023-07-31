import { Message } from 'ai'
import { and, eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'

import { auth } from '@/lib/auth'
import { db } from '@/lib/drizzle-edge'
import { serverLog } from '@/lib/posthog'

import { SessionsTable } from './schema'

function formatId(message: Message) {
  if (!message.id) {
    return {
      ...message,
      id: nanoid(),
    }
  }
  return message
}

function formatTimestamp(message: Message) {
  if (typeof message.createdAt !== 'number') {
    return {
      ...message,
      createdAt: new Date(message.createdAt || Date.now()).getTime(),
    }
  }

  return message
}

export async function updateMessagesToSession(
  sessionId: string,
  messages: Message[]
) {
  try {
    const { userId } = auth()
    if (!userId) {
      throw new Error('Not authenticated')
    }

    const formattedMessages = messages.map(formatId).map(formatTimestamp)

    const response = await db
      .update(SessionsTable)
      .set({
        messages_str: JSON.stringify(formattedMessages),
      })
      .where(
        and(
          eq(SessionsTable.short_id, sessionId),
          eq(SessionsTable.created_by, userId)
        )
      )

    serverLog.capture({
      distinctId: userId,
      event: 'success:update_messages_to_session',
      properties: {
        sessionId,
        messages,
      },
    })

    return response
  } catch (error: any) {
    return {
      error: error.message,
    }
  }
}
