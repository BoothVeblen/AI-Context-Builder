import { NextRequest } from 'next/server'
import { Message } from 'ai'

import { auth } from '@/lib/auth'
import { OpenAIStream } from '@/lib/openai-stream'
import { serverLog } from '@/lib/posthog'
import { updateMessagesToSession } from '@/db/sessions/actions-edge'

export const runtime = 'edge'

export async function POST(
  req: NextRequest
  // { params }: { params: { api_session_id: string } }
) {
  const { userId } = auth()
  if (!userId) {
    throw new Error('Not authenticated')
  }

  const body = await req.json()
  const sessionId = body.sessionId as string
  const apiSessionId = body.apiSessionId as string
  const messages = body.messages as Message[]

  const payload = {
    session_id: apiSessionId,
    messages: messages.map((message) => ({
      role: message.role,
      content: message.content,
    })),
  }

  serverLog.capture({
    distinctId: userId,
    event: 'success:chat',
    properties: payload,
  })

  const baseUrl = `${process.env.AI_SERVICE_API_BASE_URL}/v1`

  const stream = await OpenAIStream(baseUrl, payload, {
    async onCompletion(completion) {
      const payload = [
        ...messages,
        {
          role: 'assistant',
          content: completion,
          createdAt: new Date(),
        },
      ] as Message[]
      updateMessagesToSession(sessionId, payload)
    },
  })

  return new Response(stream)
}
