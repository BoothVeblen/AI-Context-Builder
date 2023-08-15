import {
  createParser,
  ParsedEvent,
  ReconnectInterval,
} from 'eventsource-parser'

export async function OpenAIStream(
  baseUrl: string,
  payload: any,
  callback?: {
    onStart?: () => Promise<void> | void
    onCompletion?: (completion: string) => Promise<void> | void
  }
) {
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  let counter = 0
  let completion = ''
  let initialed = false

  const res = await fetch(`${baseUrl}/chat/completions`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY ?? ''}`,
    },
    method: 'POST',
    body: JSON.stringify(payload),
  })

  const stream = new ReadableStream({
    async start(controller) {
      async function onParse(event: ParsedEvent | ReconnectInterval) {
        if (event.type === 'event') {
          const data = event.data
          if (data === '[DONE]') {
            if (callback?.onCompletion) {
              await callback.onCompletion(completion)
            }
            controller.close()
            return
          }
          try {
            const json = JSON.parse(data)
            const text = json.choices[0].delta?.content || ''
            if (counter < 2 && (text.match(/\n/) || []).length) {
              return
            }
            completion = completion + text
            const queue = encoder.encode(text)
            controller.enqueue(queue)
            counter++

            if (!initialed) {
              initialed = true
              if (callback?.onStart) {
                await callback.onStart()
              }
            }
          } catch (e) {
            controller.error(e)
          }
        }
      }

      // stream response (SSE) from OpenAI may be fragmented into multiple chunks
      // this ensures we properly read chunks & invoke an event for each SSE event stream
      const parser = createParser(onParse)

      // https://web.dev/streams/#asynchronous-iteration
      for await (const chunk of res.body as any) {
        parser.feed(decoder.decode(chunk))
      }
    },
  })

  return stream
}
