import { describe, expect, test, vi } from 'vitest'

import { OpenAIStream } from './openai-stream'

type MockMessage = {
  content: string
  metadata?: unknown
  abort?: boolean
  error?: boolean
}
function wrapMessage({ content, metadata, abort, error }: MockMessage) {
  if (abort) {
    return 'abort'
  }
  if (error) {
    return 'data: error\n\n'
  }
  return `data: ${JSON.stringify({
    metadata,
    choices: [
      {
        delta: {
          content,
        },
      },
    ],
  })}\n\n`
}

function mockChat(mockMessage: MockMessage[] = []) {
  const messages = [...mockMessage.map(wrapMessage), `data: [DONE]\n\n`]

  return vi.fn().mockImplementationOnce(
    () =>
      new Promise((res) => {
        const encoder = new TextEncoder()
        const s = new ReadableStream({
          async start(controller) {
            await Promise.all(
              messages.map(
                (chunk, i) =>
                  new Promise<void>((resolve) => {
                    setTimeout(
                      () => {
                        if (chunk === 'abort') {
                          resolve()
                          return
                        }
                        try {
                          controller.enqueue(encoder.encode(chunk))
                        } catch {}
                        resolve()
                      },
                      (i + 1) * 100
                    )
                  })
              )
            )
            controller.close()
          },
        })

        return res(new Response(s))
      })
  )
}

describe('openai-stream', () => {
  test('normal stream', async () => {
    const mockedFetch = mockChat([
      {
        content: 'hello',
      },
      {
        content: 'world',
      },
    ])
    global.fetch = mockedFetch
    const stream = await OpenAIStream({
      baseUrl: '',
      payload: {},
      data: { id: 1 },
    })

    expect(stream).toBeInstanceOf(ReadableStream)
    expect(mockedFetch).toBeCalledTimes(1)
    const reader = stream.getReader()
    const decoder = new TextDecoder()
    const res = []
    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        break
      }

      const message = decoder.decode(value)
      res.push(message)
    }
    expect(res).toEqual(['[DATA]{"id":1}[DATAEND]', 'hello', 'world'])
  })
  test('normal stream with callbacks', async () => {
    const onStart = vi.fn()
    const onToken = vi.fn()
    const onCompletion = vi.fn()
    const mockedFetch = mockChat([
      {
        content: 'hello',
      },
      {
        content: 'world',
      },
    ])
    global.fetch = mockedFetch
    const stream = await OpenAIStream({
      baseUrl: '',
      payload: {},
      data: { id: 1 },
      callback: {
        onStart,
        onToken,
        onCompletion,
      },
    })

    expect(stream).toBeInstanceOf(ReadableStream)
    expect(mockedFetch).toBeCalledTimes(1)
    const reader = stream.getReader()
    const decoder = new TextDecoder()
    const res = []
    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        break
      }

      const message = decoder.decode(value)
      res.push(message)
    }
    expect(res).toEqual(['[DATA]{"id":1}[DATAEND]', 'hello', 'world'])
    expect(onStart).toBeCalledTimes(1)
    expect(onToken).toBeCalledTimes(2)
    expect(onCompletion).toBeCalledTimes(1)
  })

  test('stream with error', async () => {
    const onStart = vi.fn()
    const onToken = vi.fn()
    const onCompletion = vi.fn()
    const mockedFetch = mockChat([
      {
        content: 'hello',
      },
      {
        content: 'world',
        metadata: {
          error: 'testerror',
        },
      },
    ])
    global.fetch = mockedFetch
    const stream = await OpenAIStream({
      baseUrl: '',
      payload: {},
      data: { id: 1 },
      callback: {
        onStart,
        onToken,
        onCompletion,
      },
    })

    expect(stream).toBeInstanceOf(ReadableStream)
    expect(mockedFetch).toBeCalledTimes(1)
    const reader = stream.getReader()
    const decoder = new TextDecoder()
    const res = []
    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        break
      }

      const message = decoder.decode(value)
      res.push(message)
    }
    expect(res).toEqual([
      '[DATA]{"id":1}[DATAEND]',
      'hello',
      '[DATA]{"error":"testerror"}[DATAEND]',
    ])
    expect(onStart).toBeCalledTimes(1)
    expect(onToken).toBeCalledTimes(1)
    expect(onCompletion).toBeCalledTimes(0)
  })

  test('aborted stream', async () => {
    const onStart = vi.fn()
    const onToken = vi.fn()
    const onCompletion = vi.fn()
    const mockedFetch = mockChat([
      {
        content: 'hello',
      },
      {
        content: 'world',
        abort: true,
      },
      {
        content: '2',
      },
    ])
    global.fetch = mockedFetch
    const stream = await OpenAIStream({
      baseUrl: '',
      payload: {},
      data: { id: 1 },
      callback: {
        onStart,
        onToken,
        onCompletion,
      },
    })

    expect(stream).toBeInstanceOf(ReadableStream)
    expect(mockedFetch).toBeCalledTimes(1)
    const reader = stream.getReader()
    setTimeout(() => {
      reader.cancel()
    }, 100)
    const decoder = new TextDecoder()
    const res = []
    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        break
      }

      const message = decoder.decode(value)
      res.push(message)
    }
    expect(res).toEqual(['[DATA]{"id":1}[DATAEND]', 'hello'])
    expect(onStart).toBeCalledTimes(1)
    expect(onToken).toBeCalledTimes(1)
    expect(onCompletion).toBeCalledTimes(0)
  })

  test('stream with no content', async () => {
    const onStart = vi.fn()
    const onToken = vi.fn()
    const onCompletion = vi.fn()
    const mockedFetch = mockChat([])
    global.fetch = mockedFetch
    const stream = await OpenAIStream({
      baseUrl: '',
      payload: {},
      data: { id: 1 },
      callback: {
        onStart,
        onToken,
        onCompletion,
      },
    })

    expect(stream).toBeInstanceOf(ReadableStream)
    expect(mockedFetch).toBeCalledTimes(1)
    const reader = stream.getReader()
    setTimeout(() => {
      reader.cancel()
    }, 100)
    const decoder = new TextDecoder()
    const res = []
    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        break
      }

      const message = decoder.decode(value)
      res.push(message)
    }
    expect(res).toEqual(['[DATA]{"id":1}[DATAEND]'])
    expect(onStart).toBeCalledTimes(1)
    expect(onToken).toBeCalledTimes(0)
    expect(onCompletion).toBeCalledTimes(1)
  })

  test('waiting stream', async () => {
    vi.useFakeTimers()
    const onStart = vi.fn()
    const onToken = vi.fn()
    const onCompletion = vi.fn()
    const mockedFetch = mockChat([])
    global.fetch = mockedFetch
    const stream = await OpenAIStream({
      baseUrl: '',
      payload: {},
      data: { id: 1 },
      callback: {
        onStart,
        onToken,
        onCompletion,
      },
    })
    vi.runOnlyPendingTimers()

    expect(stream).toBeInstanceOf(ReadableStream)
    expect(mockedFetch).toBeCalledTimes(1)
    const reader = stream.getReader()
    const decoder = new TextDecoder()
    const res = []
    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        break
      }

      const message = decoder.decode(value)
      res.push(message)
    }
    expect(res).toEqual(['[DATA]{"id":1}[DATAEND]', 'waiting...\n'])
    expect(onStart).toBeCalledTimes(1)
    expect(onToken).toBeCalledTimes(0)
    expect(onCompletion).toBeCalledTimes(1)
  })
})
