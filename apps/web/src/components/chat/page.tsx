'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { Message } from 'ai'
import { useChat } from 'ai/react'
import useSWRMutation from 'swr/mutation'

import { fetcher, nanoid } from '@/lib/utils'
import usePageTitle from '@/hooks/use-page-title'
import useSubscribe from '@/hooks/use-subscribe'
import { useScrollToBottom } from '@/hooks/useScrollToBottom'

import { ChatContextProvider, ChatMode } from './chat-context'
import ChatHeader from './chat-header'
import ChatInput from './chat-input'
import ChatList from './chat-list'
import RestartConfirmPage from './restart-confirm'
import { ChatApp, ChatSession, EventMessage } from './types'
import VideoCallConfirmDialog from './video-call-confirm-dialog'

function formatToTimestamp(date?: Date | number | null) {
  if (!date) return 0
  if (Object.prototype.toString.call(date) === '[object Date]') {
    return new Date(date).getTime()
  }
  if (typeof date === 'number') {
    return date
  }
  return 0
}

function eventMessageBuilder(type: string): EventMessage {
  return {
    type: 'event',
    data: {
      id: nanoid(),
      type,
      createdAt: Date.now(),
    },
  }
}

function addEvent(
  url: string,
  { arg }: { arg: { session_id: string; event: EventMessage } }
) {
  return fetcher(url, {
    method: 'POST',
    body: JSON.stringify(arg),
  })
}

interface BaseChatProps {
  session: ChatSession
  app: ChatApp | null
  mode: ChatMode
  initialMessages?: Message[]
  initialEvents?: EventMessage[]
}

interface DebugChatProps extends BaseChatProps {
  mode: 'debug'
  isConfigChanged?: boolean
  setInitialMessages?: (messages: Message[]) => void
}

interface LiveChatProps extends BaseChatProps {
  mode: 'live'
}

export type ChatProps = LiveChatProps | DebugChatProps

const Chat = (props: ChatProps) => {
  const { app, session, mode, initialMessages = [], initialEvents = [] } = props
  const {
    short_id: sessionId,
    name: sessionName,
    api_session_id: apiSessionId,
  } = session

  const [confirmReset, setConfirmReset] = useState(
    mode === 'debug' && props.isConfigChanged && initialMessages?.length !== 0
  )
  const { scrollRef, setAutoScroll } = useScrollToBottom()

  const {
    messages,
    input,
    isLoading,
    reload,
    stop,
    error,
    setMessages,
    handleSubmit,
    handleInputChange,
  } = useChat({
    id: sessionId,
    initialMessages,
    body: {
      sessionId,
      apiSessionId,
    },
    sendExtraMessageFields: true,
    onFinish: (message) => {
      if (mode === 'debug') {
        props.setInitialMessages?.([...messages, message])
      }
    },
  })

  const [eventMessages, setEventMessages] =
    useState<EventMessage[]>(initialEvents)
  const [isOpenCallConfirm, setIsOpenCallConfirm] = useState(false)
  const callLinkRef = useRef()
  const onAdd = useCallback(
    (newEventMessage: any) => {
      setEventMessages((prev) => [...prev, newEventMessage])
      if (newEventMessage?.data?.type === 'call.created') {
        callLinkRef.current = newEventMessage?.data?.link
        setIsOpenCallConfirm(true)
      }
    },
    [setEventMessages]
  )
  useSubscribe({
    channelId: `session-${sessionId}`,
    eventName: 'user-chat',
    onAdd,
    enabled:
      mode === 'live' && !!apiSessionId && !!app?.enable_video_interaction,
  })

  const openingRemarksMessages = useMemo(() => {
    if (!app?.opening_remarks) return []
    return [
      {
        type: 'chat',
        data: {
          id: nanoid(),
          role: 'assistant',
          content: app?.opening_remarks,
        },
      },
    ]
  }, [app?.opening_remarks])

  const chatMessages = useMemo(() => {
    const formattedMessages = messages?.map((message) => ({
      type: 'chat',
      data: message,
    }))
    return [
      ...openingRemarksMessages,
      ...formattedMessages,
      ...eventMessages,
    ].sort(
      (a, b) =>
        formatToTimestamp(a.data?.createdAt) -
        formatToTimestamp(b.data?.createdAt)
    )
  }, [messages, eventMessages, openingRemarksMessages])

  const handelReload = () => {
    setAutoScroll(true)
    reload()
  }

  const handelStop = () => {
    stop()
  }

  const showResend = useMemo(() => messages?.length > 0, [messages])

  usePageTitle(sessionName)

  const onRestart = () => {
    handelStop()
    setMessages([])
    setConfirmReset(false)
  }

  const onCancel = () => {
    setConfirmReset(false)
  }

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    handleSubmit(e)
    setAutoScroll(true)
  }

  const disabledRestart = !messages || messages.length === 0

  const handleAccept = useCallback(() => {
    window.open(callLinkRef.current, '_blank')
    setIsOpenCallConfirm(false)
  }, [])

  const { trigger: addEventTrigger } = useSWRMutation(
    `/api/chat/event`,
    addEvent
  )

  const handleDecline = useCallback(() => {
    const message = eventMessageBuilder('call.declined')
    setEventMessages((prev) => [...prev, message])
    setIsOpenCallConfirm(false)
    addEventTrigger({ session_id: sessionId, event: message })
  }, [sessionId, addEventTrigger])

  const handleCancel = useCallback(() => {
    const message = eventMessageBuilder('call.canceled')
    setEventMessages((prev) => [...prev, message])
    setIsOpenCallConfirm(false)
    addEventTrigger({ session_id: sessionId, event: message })
  }, [sessionId, addEventTrigger])

  return (
    <ChatContextProvider
      app={app}
      session={session}
      mode={mode}
      isLoading={isLoading}
    >
      <div className="relative h-full w-full">
        {confirmReset && (
          <RestartConfirmPage onRestart={onRestart} onCancel={onCancel} />
        )}
        <div className="flex h-full w-full flex-col">
          <ChatHeader
            onRestart={() => {
              handelStop()
              setMessages([])
            }}
            disabledRestart={disabledRestart}
          />
          <ChatList
            messages={chatMessages}
            scrollRef={scrollRef}
            error={error?.message}
            setAutoScroll={setAutoScroll}
          />
          <ChatInput
            input={input}
            onSubmit={onSubmit}
            showResend={showResend}
            reload={handelReload}
            stop={handelStop}
            handleInputChange={handleInputChange}
          />
        </div>
      </div>
      <VideoCallConfirmDialog
        open={isOpenCallConfirm}
        onOpenChange={setIsOpenCallConfirm}
        onAccept={handleAccept}
        onDecline={handleDecline}
        onCancel={handleCancel}
      />
    </ChatContextProvider>
  )
}

export default Chat
