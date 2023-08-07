'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Message } from 'ai'
import { useChat } from 'ai/react'

import { nanoid } from '@/lib/utils'
import usePageTitle from '@/hooks/use-page-title'
import { useScrollToBottom } from '@/hooks/useScrollToBottom'

import ChatHeader from './chat-header'
import ChatInput from './chat-input'
import ChatList from './chat-list'
import RestartConfirmPage from './restart-confirm'

export interface ChatProps {
  sessionId: string
  sessionName: string
  appId: string
  appName: string
  appIcon: string
  isDebug?: boolean
  apiSessionId?: string | null
  initialMessages?: Message[]
  setInitialMessages?: (messages: Message[]) => void
  isConfigChanged?: boolean
}

const Chat = ({
  sessionId,
  sessionName,
  appName,
  appIcon,
  appId,
  isDebug = false,
  apiSessionId,
  initialMessages = [],
  setInitialMessages,
  isConfigChanged,
}: ChatProps) => {
  const [waiting, setWaiting] = useState<boolean>(false)
  const [confirmReset, setConfirmReset] = useState(
    isConfigChanged && initialMessages?.length !== 0
  )
  const { scrollRef, setAutoScroll } = useScrollToBottom()

  const {
    messages,
    input,
    setInput,
    isLoading,
    reload,
    stop,
    append,
    error,
    setMessages,
  } = useChat({
    id: sessionId,
    initialMessages,
    onResponse: () => {
      setWaiting(false)
    },
    body: {
      sessionId,
      apiSessionId,
    },
    sendExtraMessageFields: true,
  })

  const handelReload = () => {
    setAutoScroll(true)
    reload()
    setWaiting(true)
  }

  const handelStop = () => {
    setWaiting(false)
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

  useEffect(() => {
    if (isDebug && setInitialMessages) setInitialMessages(messages)
  }, [messages, isDebug, setInitialMessages])

  const disabledRestart = !messages || messages.length === 0
  return (
    <div className="relative h-full w-full">
      {confirmReset && (
        <RestartConfirmPage onRestart={onRestart} onCancel={onCancel} />
      )}
      <div className="flex h-full w-full flex-col">
        <ChatHeader
          name={sessionName}
          isDebug={isDebug}
          onRestart={() => {
            handelStop()
            setMessages([])
          }}
          disabledRestart={disabledRestart}
        />
        <ChatList
          messages={messages}
          waiting={waiting}
          scrollRef={scrollRef}
          error={error?.message}
          setAutoScroll={setAutoScroll}
          appId={appId}
          appName={appName}
          appIcon={appIcon}
          isDebug={isDebug}
        />
        <ChatInput
          input={input}
          setInput={setInput}
          onSubmit={async (value) => {
            setAutoScroll(true)
            setWaiting(true)
            await append({
              id: nanoid(),
              content: value,
              role: 'user',
              createdAt: new Date(),
            })
          }}
          isLoading={isLoading}
          showResend={showResend}
          reload={handelReload}
          stop={handelStop}
          isDebug={isDebug}
        />
      </div>
    </div>
  )
}

export default Chat
