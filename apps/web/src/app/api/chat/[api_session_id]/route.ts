import { NextRequest } from 'next/server'

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
  const { userId } = auth()
  if (!userId) {
    throw new Error('Not authenticated')
  }

  const { api_session_id } = params
  const { messages } = await req.json()
  const payload = {
    session_id: api_session_id,
    messages,
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
          content: completion,
          role: 'assistant',
        },
      ]
      updateMessagesToSession(api_session_id, payload)
    },
  })
  return new Response(stream)
}
