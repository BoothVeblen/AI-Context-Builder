import { NextRequest } from 'next/server'

import { OpenAIStream } from '@/lib/openai-stream'

export const runtime = 'edge'

export async function POST(
  req: NextRequest,
  { params }: { params: { api_session_id: string } }
) {
  const { api_session_id } = params
  const { messages } = await req.json()
  const payload = {
    messages,
    session_id: api_session_id,
  }
  console.log('payload:', payload)
  const baseUrl = process.env.AI_SERVICE_API_BASE_URL!
  const stream = await OpenAIStream(baseUrl, payload)
  return new Response(stream)
}
