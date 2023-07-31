'use client'

import { useMemo, useState } from 'react'
import { Message } from 'ai'
import { useChat } from 'ai/react'

import { nanoid } from '@/lib/utils'
import usePageTitle from '@/hooks/use-page-title'
import { useScrollToBottom } from '@/hooks/useScrollToBottom'
import { useToast } from '@/components/ui/use-toast'

import ChatHeader from './chat-header'
import ChatInput from './chat-input'
import ChatList from './chat-list'

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
  const { scrollRef, setAutoScroll } = useScrollToBottom()
  const { toast } = useToast()

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
  }

  return (
    <div className="flex h-full w-full flex-col">
      <ChatHeader name={sessionName} isDebug={isDebug} onRestart={onRestart} />
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
  )
}

export default Chat
