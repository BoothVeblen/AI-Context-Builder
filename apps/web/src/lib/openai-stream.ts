import { createParser } from 'eventsource-parser'

import {
  MESSAGE_FOR_KEEP_STREAM_CONNECTION,
  MESSAGE_FOR_STREAM_ENDING,
} from './const'

function encodeData(data: Record<string, unknown>) {
  return `[DATA]${JSON.stringify(data)}[DATAEND]`
}

type StreamParams = {
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
}

export async function OpenAIStream({
  baseUrl,
  payload,
  callback,
  data,
}: StreamParams) {
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

  if (!res.body) {
    throw new Error('no response body')
  }
  const stream = res.body
    .pipeThrough(createParserTransformer())
    .pipeThrough(createProcessTransformer(callback))
    .pipeThrough(createMetaTransformer(data))
    .pipeThrough(createEncoderTransformer())

  stream.cancel = async () => {
    abortController.abort()
  }

  return stream
}

function createMetaTransformer(
  data: Record<string, unknown>
): TransformStream<string, string> {
  let waitingId: NodeJS.Timeout | null = null
  return new TransformStream({
    start(controller) {
      controller.enqueue(encodeData(data))
      waitingId = setInterval(() => {
        controller.enqueue(MESSAGE_FOR_KEEP_STREAM_CONNECTION)
      }, 20 * 1000)
    },
    transform(chunk, controller) {
      if (waitingId) {
        clearInterval(waitingId)
        waitingId = null
      }
      controller.enqueue(chunk)
    },
  })
}

function createProcessTransformer(
  callbacks: StreamParams['callback']
): TransformStream<string, string> {
  let metadata: any
  let counter = 0
  let completion = ''
  let error = false
  return new TransformStream({
    async start() {
      await callbacks?.onStart?.()
    },
    async transform(chunk, controller) {
      if (chunk === MESSAGE_FOR_STREAM_ENDING) {
        return
      }
      try {
        const json = JSON.parse(chunk)
        metadata = json.metadata
        if (metadata?.error) {
          error = true
          controller.enqueue(
            encodeData({
              error: metadata.error,
            })
          )
          return
        }
        const text = json.choices?.[0].delta?.content || ''
        if (counter < 2 && (text.match(/\n/) || []).length) {
          return
        }
        completion = completion + text
        const queue = text
        controller.enqueue(queue)
        counter++

        await callbacks?.onToken?.(text)
      } catch (e) {
        controller.error(e)
      }
    },
    async flush() {
      if (!error) {
        await callbacks?.onCompletion?.(completion, metadata)
      }
    },
  })
}

function createParserTransformer(): TransformStream<Uint8Array, string> {
  const decoder = new TextDecoder()
  let parser: ReturnType<typeof createParser>
  return new TransformStream({
    start(controller) {
      parser = createParser((chunk) => {
        if (chunk.type === 'reconnect-interval') {
          return
        }
        controller.enqueue(chunk.data)
      })
    },
    transform(chunk) {
      parser.feed(decoder.decode(chunk))
    },
  })
}

function createEncoderTransformer(): TransformStream<string, Uint8Array> {
  const encoder = new TextEncoder()
  return new TransformStream({
    transform(chunk, controller) {
      controller.enqueue(encoder.encode(chunk))
    },
  })
}
