import { useEffect } from 'react'
import { cleanup, render, waitFor } from '@testing-library/react'
import user from '@testing-library/user-event'
import { nanoid } from 'nanoid'
import { afterEach, beforeAll, describe, expect, test, vi } from 'vitest'

import Chat from '@/components/chat/page'

import { commonTestWrapper } from '../../../test/utils'

describe('Chat', () => {
  global.fetch = mockChat()
  function mockChat() {
    const mockMessages = [
      ['hello', 'world', 'thisis', 'atest'],
      ['hello', 'world', 'message2'],
    ]
    let i = 0
    return vi.fn().mockImplementation(
      (path: string) =>
        new Promise((res) => {
          if (path === '/api/chat') {
            const stream = new ReadableStream({
              start: async (controller) => {
                const encoder = new TextEncoder()
                if (i >= mockMessages.length) {
                  i = 0
                }
                const mockMessage = mockMessages[i++]
                await Promise.all(
                  mockMessage.map(
                    (m, i) =>
                      new Promise<void>((res) => {
                        setTimeout(() => {
                          try {
                            controller.enqueue(encoder.encode(m))
                          } catch {}
                          res()
                        }, i * 500)
                      })
                  )
                )
                controller.close()
              },
            })
            res(new Response(stream))
          }
        })
    )
  }

  beforeAll(() => {
    vi.mock('@clerk/nextjs', () => ({
      useUser: () => ({
        firstName: 'test',
        lastName: 'user',
        fullName: 'test user',
      }),
    }))
    vi.mock('@/hooks/use-subscribe', () => ({
      __esModule: true,
      default: ({ onAdd, enabled }: any) => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useEffect(() => {
          if (enabled) {
            setTimeout(() => {
              onAdd({
                eventType: 'call.created',
                id: nanoid(),
              })
            }, 500)
          }
          // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [])
      },
    }))
  })

  afterEach(() => {
    cleanup()
  })

  test('send message and regenerate', async () => {
    const component = render(
      commonTestWrapper(
        <Chat
          workflow={[]}
          app={{
            name: 'chat-app',
            short_id: 'YhTq4Xx29aDZ',
            icon: '',
            enable_video_interaction: false,
            opening_remarks: 'yo',
          }}
          mode="live"
          session={{
            api_session_id: '21486acbbd393f8a6131a9009d6aae4d',
            short_id: 'srQuAKvgZR7W',
            name: 'test-chat-session',
          }}
          initialMessages={[
            {
              id: '1',
              content: 'hello1',
              role: 'user',
              type: 'chat',
              createdAt: new Date('2023-01-01 00:00:00'),
            },
            {
              id: '2',
              content: 'hello2',
              role: 'assistant',
              type: 'chat',
              createdAt: new Date('2023-01-01 00:00:01'),
            },
            {
              id: '3',
              content: 'hello3',
              role: 'user',
              type: 'chat',
              createdAt: new Date('2023-01-01 00:00:02'),
            },
            {
              id: '4',
              content: 'hello4',
              role: 'assistant',
              type: 'chat',
              createdAt: new Date('2023-01-01 00:00:03'),
            },
          ]}
        />
      )
    )
    const { asFragment, queryByTestId } = component
    expect(asFragment()).toMatchSnapshot()
    const sendButton = queryByTestId('send')!
    const input = queryByTestId('input')!

    expect(queryByTestId('send')).toBeInTheDocument()

    expect(sendButton).toBeDisabled()

    await user.click(input)

    await user.keyboard('hello, to test the textarea keypress')

    expect(sendButton).not.toBeDisabled()

    await user.click(sendButton)

    expect(input.textContent).toBe('')

    expect(sendButton).toBeDisabled()

    await waitFor(() => {
      expect(queryByTestId('stop')!).toBeInTheDocument()
    })
    await waitFor(
      () => {
        expect(
          component.queryByText('helloworldthisisatest')
        ).toBeInTheDocument()
      },
      {
        timeout: 10000,
      }
    )

    await waitFor(() => {
      const regen = component.queryByText('Regenerate response')!
      expect(regen).toBeInTheDocument()
      user.click(regen)
    })

    await waitFor(() => {
      const stop = queryByTestId('stop')!
      expect(stop).toBeInTheDocument()
      user.click(stop)
    })

    await waitFor(() => {
      const regen = component.queryByText('Regenerate response')!
      expect(regen).toBeInTheDocument()
    })
  })

  test('accept event', async () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)

    const component = render(
      commonTestWrapper(
        <Chat
          workflow={[]}
          app={{
            name: 'chat-app',
            short_id: 'YhTq4Xx29aDZ',
            icon: '',
            enable_video_interaction: true,
            opening_remarks: 'yo',
          }}
          mode="live"
          session={{
            api_session_id: '21486acbbd393f8a6131a9009d6aae4d',
            short_id: 'srQuAKvgZR7W',
            name: 'test-chat-session',
          }}
        />
      )
    )
    await waitFor(async () => {
      const dialog = component.getByTestId('video-call-confirm-dialog')
      expect(dialog).toBeInTheDocument()
      await user.click(component.getByTestId('accept-video-call'))
      expect(open).toBeCalled()
      expect(dialog).not.toBeInTheDocument()
    })
  })

  test('decline event', async () => {
    const component = render(
      commonTestWrapper(
        <Chat
          workflow={[]}
          app={{
            name: 'chat-app',
            short_id: 'YhTq4Xx29aDZ',
            icon: '',
            enable_video_interaction: true,
            opening_remarks: 'yo',
          }}
          mode="live"
          session={{
            api_session_id: '21486acbbd393f8a6131a9009d6aae4d',
            short_id: 'srQuAKvgZR7W',
            name: 'test-chat-session',
          }}
        />
      )
    )
    await waitFor(async () => {
      const dialog = component.getByTestId('video-call-confirm-dialog')
      expect(dialog).toBeInTheDocument()
      await user.click(component.getByTestId('decline-video-call'))
      expect(dialog).not.toBeInTheDocument()
      expect(component.getByText('Call Declined')).toBeInTheDocument()
    })
  })

  test('cancel event', async () => {
    vi.mock('usehooks-ts', () => ({
      ...vi.importActual('usehooks-ts'),
      useCountdown: () => [
        0,
        {
          startCountdown: () => {},
        },
      ],
    }))
    const component = render(
      commonTestWrapper(
        <Chat
          workflow={[]}
          app={{
            name: 'chat-app',
            short_id: 'YhTq4Xx29aDZ',
            icon: '',
            enable_video_interaction: true,
            opening_remarks: 'yo',
          }}
          mode="live"
          session={{
            api_session_id: '21486acbbd393f8a6131a9009d6aae4d',
            short_id: 'srQuAKvgZR7W',
            name: 'test-chat-session',
          }}
        />
      )
    )
    await waitFor(async () => {
      const dialog = component.getByTestId('video-call-confirm-dialog')
      expect(dialog).toBeInTheDocument()
    })
    await waitFor(async () => {
      const dialog = component.queryByTestId('video-call-confirm-dialog')
      expect(dialog).not.toBeInTheDocument()
      expect(component.getAllByText('Call Canceled')).toBeTruthy()
    })
  })

  test('stop when generating', async () => {
    const component = render(
      commonTestWrapper(
        <Chat
          workflow={[]}
          app={{
            name: 'chat-app',
            short_id: 'YhTq4Xx29aDZ',
            icon: '',
            enable_video_interaction: false,
            opening_remarks: 'yo',
          }}
          mode="live"
          session={{
            api_session_id: '21486acbbd393f8a6131a9009d6aae4d',
            short_id: 'srQuAKvgZR7W',
            name: 'test-chat-session',
          }}
          initialMessages={[
            {
              id: '1',
              content: 'hello1',
              role: 'user',
              type: 'chat',
              createdAt: new Date('2023-01-01 00:00:00'),
            },
            {
              id: '2',
              content: 'hello2',
              role: 'assistant',
              type: 'chat',
              createdAt: new Date('2023-01-01 00:00:01'),
            },
            {
              id: '3',
              content: 'hello3',
              role: 'user',
              type: 'chat',
              createdAt: new Date('2023-01-01 00:00:02'),
            },
            {
              id: '4',
              content: 'hello4',
              role: 'assistant',
              type: 'chat',
              createdAt: new Date('2023-01-01 00:00:03'),
            },
          ]}
        />
      )
    )

    const sendButton = component.queryByTestId('send')!
    const input = component.queryByTestId('input')!

    await user.click(input)

    await user.keyboard('hello, to test the textarea keypress2')

    await user.click(sendButton)

    await waitFor(async () => {
      expect(component.queryByText('hello')).toBeInTheDocument()
      await user.click(component.queryByTestId('stop')!)
      expect(component.queryByText('hello')).toBeInTheDocument()
      expect(
        component.queryByText('hello, to test the textarea keypress2')
      ).toBeInTheDocument()
    })
  })

  test('stop before generating', async () => {
    const component = render(
      commonTestWrapper(
        <Chat
          workflow={[]}
          app={{
            name: 'chat-app',
            short_id: 'YhTq4Xx29aDZ',
            icon: '',
            enable_video_interaction: false,
            opening_remarks: 'yo',
          }}
          mode="live"
          session={{
            api_session_id: '21486acbbd393f8a6131a9009d6aae4d',
            short_id: 'srQuAKvgZR7W',
            name: 'test-chat-session',
          }}
          initialMessages={[
            {
              id: '1',
              content: 'hello1',
              role: 'user',
              type: 'chat',
              createdAt: new Date('2023-01-01 00:00:00'),
            },
            {
              id: '2',
              content: 'hello2',
              role: 'assistant',
              type: 'chat',
              createdAt: new Date('2023-01-01 00:00:01'),
            },
            {
              id: '3',
              content: 'hello3',
              role: 'user',
              type: 'chat',
              createdAt: new Date('2023-01-01 00:00:02'),
            },
            {
              id: '4',
              content: 'hello4',
              role: 'assistant',
              type: 'chat',
              createdAt: new Date('2023-01-01 00:00:03'),
            },
          ]}
        />
      )
    )

    const sendButton = component.queryByTestId('send')!
    const input = component.queryByTestId('input')!

    await user.click(input)

    await user.keyboard('testing stop before generating')

    await user.click(sendButton)

    await user.click(component.queryByTestId('stop')!)
    expect(
      component.queryByText('testing stop before generating')
    ).toBeInTheDocument()
  })
})
