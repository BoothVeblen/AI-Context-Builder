import { Message } from 'ai'
import { and, eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'

import { auth } from '@/lib/auth'
import { db } from '@/lib/drizzle-edge'
import { serverLog } from '@/lib/posthog'

import { SessionsTable } from './schema'

export async function updateMessagesToSession(
  apiSessionId: string,
  messages: Message[]
) {
  try {
    const { userId } = auth()
    if (!userId) {
      throw new Error('Not authenticated')
    }

    const formattedMessages = messages.map((message) => {
      if (!message.id) {
        return {
          ...message,
          id: nanoid(),
        }
      }
      return message
    })

    const response = await db
      .update(SessionsTable)
      .set({
        messages_str: JSON.stringify(formattedMessages),
      })
      .where(
        and(
          eq(SessionsTable.api_session_id, apiSessionId),
          eq(SessionsTable.created_by, userId)
        )
      )

    serverLog.capture({
      distinctId: userId,
      event: 'success:update_messages_to_session',
      properties: {
        api_session_id: apiSessionId,
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
