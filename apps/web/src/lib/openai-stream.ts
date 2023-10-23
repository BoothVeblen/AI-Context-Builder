import {
  createParser,
  ParsedEvent,
  ReconnectInterval,
} from 'eventsource-parser'

import { MESSAGE_FOR_KEEP_STREAM_CONNECTION } from './const'

function encodeData(data: Record<string, unknown>) {
  return `[DATA]${JSON.stringify(data)}[DATAEND]`
}

export async function OpenAIStream({
  baseUrl,
  payload,
  callback,
  data,
}: {
  baseUrl: string
  payload: any
  callback?: {
    onStart?: () => Promise<void> | void
    onCompletion?: (
      completion: string,
      metadata: Record<string, any>
    ) => Promise<void> | void
    onToken?: (token: string) => Promise<void> | void
  }
  data: Record<string, unknown>
}) {
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  let counter = 0
  let completion = ''
  let initialed = false
  let error = false
  let aborted = false
  const abortController = new AbortController()
  const res = await fetch(`${baseUrl}/chat/completions`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY ?? ''}`,
    },
    method: 'POST',
    body: JSON.stringify(payload),
    signal: abortController.signal,
  })

  const stream = new ReadableStream({
    cancel() {
      aborted = true
      abortController.abort()
    },
    async start(controller) {
      // prevent the stream from closing when the initial response is too long
      const waitingId = setInterval(() => {
        const queue = encoder.encode(MESSAGE_FOR_KEEP_STREAM_CONNECTION)
        controller.enqueue(queue)
      }, 20 * 1000)

      let metadata: any

      controller.enqueue(encoder.encode(encodeData(data)))

      async function onParse(event: ParsedEvent | ReconnectInterval) {
        if (event.type === 'event') {
          const data = event.data
          if (data === '[DONE]') {
            if (!initialed) {
              initialed = true
              if (callback?.onStart) {
                await callback.onStart()
              }
            }
            // run onCompletion only if there is no error
            if (callback?.onCompletion && !error) {
              // todo actual impl
              await callback.onCompletion(completion, metadata ?? {})
            }
            controller.close()
            if (waitingId) clearInterval(waitingId)
            return
          }
          try {
            const json = JSON.parse(data)
            metadata = json.metadata
            if (metadata?.error) {
              error = true
              controller.enqueue(
                encoder.encode(
                  encodeData({
                    error: metadata.error,
                  })
                )
              )
              return
            }
            const text = json.choices?.[0].delta?.content || ''
            if (counter < 2 && (text.match(/\n/) || []).length) {
              return
            }
            completion = completion + text
            const queue = encoder.encode(text)
            controller.enqueue(queue)
            counter++

            if (callback?.onToken) {
              await callback.onToken(text)
            }

            if (!initialed) {
              initialed = true

              if (waitingId) clearInterval(waitingId)

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
        if (aborted) {
          break
        }
        parser.feed(decoder.decode(chunk))
      }
    },
  })

  return stream
}
