import { NextRequest } from 'next/server'
import { Message } from 'ai'

import { auth, currentUserEmail } from '@/lib/auth'
import { flags } from '@/lib/flags'
import { logsnag } from '@/lib/logsnag'
import { OpenAIStream } from '@/lib/openai-stream'
import { nanoid } from '@/lib/utils'
import { addMessage, editMessage, removeMessage } from '@/db/messages/actions'

export const runtime = 'edge'
// TODO: move to pdx1 (us-west-2) where db is located
// https://vercel.com/docs/edge-network/regions
export const preferredRegion = 'cle1' // now at us-east-2 where ai service is located
export const dynamic = 'force-dynamic'

const baseUrl = `${process.env.AI_SERVICE_API_BASE_URL}/v1`

export async function POST(req: NextRequest) {
  const { userId } = auth()
  if (!userId) {
    throw new Error('Not authenticated')
  }

  const email = await currentUserEmail()
  const body = await req.json()
  const appId = body.appId as string
  const sessionId = body.sessionId as string
  const apiSessionId = body.apiSessionId as string
  const messages = body.messages as Message[]
  const reloadMessageId = body.reload_message_id as string

  const payload = {
    session_id: apiSessionId,
    messages: messages.map((message) => ({
      role: message.role,
      content: message.content,
    })),
  }

  const requestId = nanoid()
  await logsnag?.track({
    user_id: userId,
    channel: 'chat',
    event: 'Chat Request',
    icon: '➡️',
    description: `${email} send a request with ${messages.length} messages`,
    tags: {
      'request-id': requestId,
      'user-id': userId,
      'app-id': appId || 'unknown',
      'session-id': sessionId,
      'message-count': messages.length,
      'is-prod': flags.isProd,
    },
  })

  const messageId = reloadMessageId || nanoid()

  const requestTimestamp = Date.now()

  const stream = await OpenAIStream({
    baseUrl,
    payload,
    callback: {
      async onStart() {
        const responseTimestamp = Date.now()
        const latencyMs = responseTimestamp - requestTimestamp
        await logsnag?.track({
          user_id: userId,
          channel: 'chat',
          event: 'Chat Response',
          icon: '⬅️',
          description: `${email} get a response within ${latencyMs}ms`,
          tags: {
            'request-id': requestId,
            'user-id': userId,
            'app-id': appId || 'unknown',
            'session-id': sessionId,
            'latency-ms': latencyMs,
            'is-prod': flags.isProd,
          },
        })
      },
      async onCompletion(completion, metadata) {
        const responseTimestamp = Date.now()
        const latency = responseTimestamp - requestTimestamp
        const [userMessage] = messages
          .filter((m) => m.role === 'user')
          .slice(-1)
        const newMessage = {
          type: 'chat',
          short_id: messageId,
          session_id: sessionId,
          query: userMessage.content,
          answer: completion,
          feedback: null,
          feedback_content: null,
          latency,
          ...(metadata?.token?.total_tokens && {
            total_tokens: metadata.token.total_tokens,
          }),
          ...(metadata?.raw && { raw: metadata.raw }),
        }
        if (reloadMessageId) {
          await editMessage(messageId, newMessage)
        } else {
          await addMessage(newMessage)
        }
      },
    },
    data: {
      id: messageId,
    },
  })

  return new Response(stream)
}
