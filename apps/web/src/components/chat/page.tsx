'use client'

import { useMemo, useState } from 'react'
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
}: ChatProps) => {
  const [waiting, setWaiting] = useState<boolean>(false)
  const [confirmReset, setConfirmReset] = useState(false)
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
    api: apiSessionId ? `/api/chat/${apiSessionId}` : undefined,
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
    setMessages([])
    setConfirmReset(false)
    stop()
  }

  const onCancel = () => {
    setConfirmReset(false)
  }

  const disabled = isDebug && !apiSessionId
  return (
    <div className="relative h-full w-full">
      {confirmReset && (
        <RestartConfirmPage onRestart={onRestart} onCancel={onCancel} />
      )}
      <div className="flex h-full w-full flex-col">
        <ChatHeader
          name={sessionName}
          isDebug={isDebug}
          onRestart={() => setConfirmReset(true)}
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
          disabled={disabled}
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
