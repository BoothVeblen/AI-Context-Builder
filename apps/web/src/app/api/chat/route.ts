import { NextRequest, NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'
import { and, eq } from 'drizzle-orm'

import { auth, currentUserEmail } from '@/lib/auth'
import { db } from '@/lib/drizzle-edge'
import { flags } from '@/lib/flags'
import { logsnag } from '@/lib/logsnag'
import { OpenAIStream } from '@/lib/openai-stream'
import { nanoid } from '@/lib/utils'
import { addMessage, editMessage } from '@/db/messages/actions'
import { MessagesTable } from '@/db/messages/schema'

const redis = Redis.fromEnv()

export const runtime = 'edge'
// TODO: move to pdx1 (us-west-2) where db is located
// https://vercel.com/docs/edge-network/regions
export const preferredRegion = 'cle1' // now at us-east-2 where ai service is located
export const dynamic = 'force-dynamic'

const baseUrl = `${process.env.AI_SERVICE_API_BASE_URL}/v1`

type MessageDTO =
  | {
      role: 'user'
      content: string
    }
  | {
      id: string
      role: 'assistant'
      content: string
    }

export async function POST(req: NextRequest, res: NextResponse) {
  // if (process.env.NODE_ENV === 'development' && process.env.MOCK_CHAT) {
  //   const s = new ReadableStream({
  //     async start(controller) {
  //       await Promise.all(
  //         [
  //           `[DATA]${JSON.stringify({ id: nanoid() })}[DATAEND]`,
  //           'hello ',
  //           'how ',
  //           'are ',
  //           'you?',
  //         ].map(
  //           (chunk, i) =>
  //             new Promise<void>((resolve) => {
  //               setTimeout(
  //                 () => {
  //                   try {
  //                     controller.enqueue(chunk)
  //                   } catch {}
  //                   resolve()
  //                 },
  //                 (i + 1) * 1000
  //               )
  //             })
  //         )
  //       )
  //       // ? mock error
  //       // controller.enqueue(
  //       //   `\n[DATA]${JSON.stringify({ error: 'custom erro' })}[DATAEND]`
  //       // )
  //       try {
  //         controller.close()
  //       } catch {}
  //     },
  //   })
  //   return new Response(s)
  // }
  const { userId } = auth()
  if (!userId) {
    throw new Error('Not authenticated')
  }

  const email = await currentUserEmail()
  const body = await req.json()
  const appId = body.appId as string
  const sessionId = body.sessionId as string
  const apiSessionId = body.apiSessionId as string
  // const messages = body.messages as Message[]
  const query = body.query as string
  const reloadMessageId = body.reloadId as string

  const redisKey = `web:session:${sessionId}`

  let messageDTO = await redis.get<MessageDTO[]>(redisKey)

  if (!messageDTO || messageDTO.length === 0) {
    const rawMessages = await db
      .select({
        query: MessagesTable.query,
        content: MessagesTable.answer,
        id: MessagesTable.short_id,
      })
      .from(MessagesTable)
      .where(
        and(
          eq(MessagesTable.session_id, sessionId),
          eq(MessagesTable.type, 'chat')
        )
      )

    messageDTO = rawMessages
      .map((message) => {
        return [
          {
            role: 'user',
            content: message.query,
          },
          {
            id: message.id,
            role: 'assistant',
            content: message.content,
          },
        ]
      })
      .flat() as MessageDTO[]
  }

  if (reloadMessageId) {
    if (messageDTO.length > 0) {
      const lastMessage = messageDTO[messageDTO.length - 1]
      if (
        lastMessage.role === 'assistant' &&
        lastMessage.id === reloadMessageId
      ) {
        messageDTO = messageDTO.slice(0, -1)
      }
    }
  } else {
    messageDTO = messageDTO.concat({
      role: 'user',
      content: query,
    })
  }

  const payload = {
    session_id: apiSessionId,
    messages: messageDTO,
    reload: !!reloadMessageId,
  }

  const requestId = nanoid()
  await logsnag?.track({
    user_id: userId,
    channel: 'chat',
    event: 'Chat Request',
    icon: '➡️',
    description: `${email} send a request with ${messageDTO.length} messages`,
    tags: {
      'request-id': requestId,
      'user-id': userId,
      'app-id': appId || 'unknown',
      'session-id': sessionId,
      'message-count': messageDTO.length,
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
        if (!messageDTO) {
          return
        }
        const [userMessage] = messageDTO
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
        // do not add empty response to redis
        if (completion) {
          messageDTO.push({
            id: messageId,
            role: 'assistant',
            content: completion,
          })
        }
        if (reloadMessageId) {
          await editMessage(messageId, newMessage)
        } else {
          await addMessage(newMessage)
        }
        await redis.set(redisKey, messageDTO, {
          ex: 60 * 60 * 24,
        })
      },
    },
    data: {
      id: messageId,
    },
  })
  req.signal.onabort = () => {
    stream.cancel()
  }

  return new Response(stream)
}
