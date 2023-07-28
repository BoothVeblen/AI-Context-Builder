// import { OpenAIStream, StreamingTextResponse } from 'ai'
// import axios from 'axios'
// import { Configuration, OpenAIApi } from 'openai-edge'

import { auth } from '@/lib/auth'
import { OpenAIStream } from '@/lib/openai-stream'
import { serverLog } from '@/lib/posthog'

// IMPORTANT! Set the runtime to edge
export const runtime = 'edge'

export async function POST(req: Request) {
  const { userId } = auth()
  if (!userId) {
    throw new Error('Not authenticated')
  }

  // Extract the `prompt` from the body of the request
  const { messages } = await req.json()
  const payload = {
    model: 'gpt-3.5-turbo',
    stream: true,
    messages,
  }
  serverLog.capture({
    distinctId: userId,
    event: 'success:chat:openai',
    properties: payload,
  })
  const baseUrl = process.env.OPENAI_BASE_PATH!
  const stream = await OpenAIStream(baseUrl, payload)
  return new Response(stream)
}

// // Create an OpenAI API client (that's edge friendly!)
// const config = new Configuration({
//   apiKey: process.env.OPENAI_API_KEY,
//   basePath: process.env.OPENAI_BASE_PATH,
// })
// const openai = new OpenAIApi(config)

// export async function POST(req: Request) {
//   // Extract the `prompt` from the body of the request
//   const { messages } = await req.json()

//   // Ask OpenAI for a streaming chat completion given the prompt
//   const response = await openai.createChatCompletion({
//     model: 'gpt-3.5-turbo',
//     stream: true,
//     messages: messages.map((message: any) => ({
//       content: message.content,
//       role: message.role,
//     })),
//   })

//   // Convert the response into a friendly text-stream
//   const stream = OpenAIStream(response)
//   // Respond with the stream
//   return new StreamingTextResponse(stream)
// }
