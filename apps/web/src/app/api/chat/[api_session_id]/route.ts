import { NextRequest, NextResponse } from 'next/server'
import { Message } from 'ai'

import { auth } from '@/lib/auth'
import { OpenAIStream } from '@/lib/openai-stream'
import { serverLog } from '@/lib/posthog'
import { updateMessagesToSession } from '@/db/sessions/actions'

// TODO: https://neon.tech/blog/sub-10ms-postgres-queries-for-vercel-edge-functions
// export const runtime = 'edge'

export async function POST(
  req: NextRequest,
  { params }: { params: { api_session_id: string } }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      throw new Error('Not authenticated')
    }

    const { api_session_id } = params
    const body = await req.json()
    const messages = body.messages as Message[]
    const payload = {
      session_id: api_session_id,
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
          },
        ] as Message[]
        updateMessagesToSession(api_session_id, payload)
      },
    })
    return new Response(stream)
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500, statusText: error.message }
    )
  }
}
