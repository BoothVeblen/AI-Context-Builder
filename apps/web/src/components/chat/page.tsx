'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { useModal } from '@ebay/nice-modal-react'
import { useSWRConfig } from 'swr'
import useSWRMutation from 'swr/mutation'

import { fetcher, nanoid } from '@/lib/utils'
import { useChatEvent } from '@/hooks/use-chat-event'
import usePageTitle from '@/hooks/use-page-title'
import useSubscribe from '@/hooks/use-subscribe'
import { useScrollToBottom } from '@/hooks/useScrollToBottom'

import { ChatContextProvider, ChatMode } from './chat-context'
import ChatHeader from './chat-header'
import ChatInput from './chat-input'
import ChatList from './chat-list'
import ChatProcess from './chat-process'
import RestartConfirmPage from './restart-confirm'
import {
  ChatApp,
  ChatMessage,
  ChatSession,
  ChatUser,
  EventMessage,
  ProcessTask,
} from './types'
import useConfigBase64 from './use-config-base64'
import { useChat } from './useChat'
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
    id: nanoid(),
    createdAt: new Date(),
    eventType: type,
    role: 'assistant',
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
  user?: ChatUser | null
  mode: ChatMode
  initialMessages?: ChatMessage[]
  initialEvents?: EventMessage[]
}

interface DebugChatProps extends BaseChatProps {
  mode: 'debug'
  isConfigChanged?: boolean
  setInitialMessages?: (messages: ChatMessage[]) => void
  onRestart?: () => void
}

interface LiveChatProps extends BaseChatProps {
  mode: 'live'
  workflow: ProcessTask[]
}

export type ChatProps = LiveChatProps | DebugChatProps

const createInputMessage = (input: string) => {
  const inputMsg: ChatMessage = {
    id: nanoid(),
    content: input,
    createdAt: new Date(),
    role: 'user',
    type: 'chat',
  }
  return inputMsg
}

const Chat = (props: ChatProps) => {
  const {
    app,
    session,
    user,
    mode,
    initialMessages = [],
    initialEvents = [],
  } = props
  const appId = app?.short_id
  const appName = app?.name || ''
  const {
    short_id: sessionId,
    name: sessionName,
    api_session_id: apiSessionId,
  } = session

  const isDebug = mode === 'debug'
  const [confirmReset, setConfirmReset] = useState(
    isDebug && props.isConfigChanged && initialMessages?.length !== 0
  )
  const [showProcess, setShowProcess] = useState(false)

  const { scrollRef, setAutoScroll } = useScrollToBottom()
  const { mutate } = useSWRConfig()

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
      appId,
      sessionId,
      apiSessionId,
    },
    sendExtraMessageFields: true,
    onFinish: (message) => {
      if (isDebug && currentInput?.current) {
        props?.setInitialMessages?.([
          ...messages,
          currentInput.current,
          message,
        ])
      }
      if (mode === 'live') {
        mutate(`/api/chat/process?api_session_id=${apiSessionId}`)
      }
    },
  })

  const { eventMessages, setEventMessages } = useChatEvent({
    id: sessionId,
    initialEvents,
  })

  const callLinkRef = useRef('')
  const configStr = useConfigBase64({ appName })

  const currentInput = useRef<ChatMessage>()

  const chatMessages = useMemo(() => {
    return [...messages, ...eventMessages].sort(
      (a, b) => formatToTimestamp(a.createdAt) - formatToTimestamp(b.createdAt)
    )
  }, [messages, eventMessages])

  const set = new Set(input?.split(''))
  const isEmpty = set?.size === 1 && set.has('\n')
  const disabled = isEmpty || !input || !input?.trim() || isLoading
  const handelReload = () => {
    setAutoScroll(true)
    reload()
  }

  const handelStop = () => {
    stop()
  }

  const showResend = useMemo(() => messages?.length > 0, [messages])

  usePageTitle(sessionName)

  const handleRestartConfirm = () => {
    handleRestart()
    setConfirmReset(false)
  }

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (disabled) {
      return
    }
    handleSubmit(e)
    setAutoScroll(true)
    if (isDebug) {
      currentInput.current = createInputMessage(input)
    }
  }

  const disabledRestart =
    messages.length === 0 ||
    ((app?.opening_remarks && messages?.length == 1) as boolean)

  const modal = useModal(VideoCallConfirmDialog)
  const closeModal = useCallback(() => {
    modal.hide()
    setTimeout(() => {
      modal.remove()
    }, 200)
  }, [modal])

  const handleAccept = useCallback(() => {
    window.open(callLinkRef.current, '_blank')
    closeModal()
  }, [closeModal])

  const { trigger: addEventTrigger } = useSWRMutation(
    `/api/chat/event`,
    addEvent
  )

  const handleDecline = useCallback(() => {
    const message = eventMessageBuilder('call.declined')
    setEventMessages((prev) => [...prev, message])
    addEventTrigger({ session_id: sessionId, event: message })
    closeModal()
  }, [sessionId, addEventTrigger, setEventMessages, closeModal])

  const handleCancel = useCallback(() => {
    const message = eventMessageBuilder('call.canceled')
    setEventMessages((prev) => [...prev, message])
    addEventTrigger({ session_id: sessionId, event: message })
    closeModal()
  }, [sessionId, addEventTrigger, setEventMessages, closeModal])

  const openModal = useCallback(() => {
    modal.show({
      appId: app?.short_id ?? '',
      appIcon: app?.icon ?? '',
      appName: app?.name ?? '',
      onAccept: handleAccept,
      onDecline: handleDecline,
      onCancel: handleCancel,
    })
  }, [modal, app, handleAccept, handleDecline, handleCancel])

  const handleRestart = () => {
    handelStop()
    setMessages([])
    if (isDebug) {
      props?.onRestart?.()
    }
  }

  const onAdd = useCallback(
    (newEventMessage: any) => {
      if (newEventMessage?.eventType === 'call.created') {
        callLinkRef.current = `${newEventMessage?.link || ''}${
          configStr ? `?c=${configStr}` : ''
        }`
        openModal()
        return
      }
      setEventMessages((prev) => [...prev, newEventMessage])
    },
    [setEventMessages, configStr, openModal]
  )
  useSubscribe({
    channelId: `session-${sessionId}`,
    eventName: 'user-chat',
    onAdd,
    enabled:
      mode === 'live' && !!apiSessionId && !!app?.enable_video_interaction,
  })

  return (
    <ChatContextProvider
      app={app}
      session={session}
      user={user}
      mode={mode}
      isLoading={isLoading}
    >
      <div className="relative h-full w-full">
        {confirmReset && (
          <RestartConfirmPage
            onRestart={handleRestartConfirm}
            onCancel={() => setConfirmReset(false)}
          />
        )}
        <div className="flex h-full w-full flex-col">
          <ChatHeader
            onRestart={handleRestart}
            disabledRestart={disabledRestart}
            showProcess={showProcess}
            setShowProcess={setShowProcess}
          />
          <div className="flex h-0 flex-1">
            <div className="flex flex-1 flex-col">
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
                disabled={disabled}
              />
            </div>
            {mode === 'live' && showProcess && (
              <div className="w-[380px] border-l">
                <ChatProcess workflow={props.workflow} />
              </div>
            )}
          </div>
        </div>
      </div>
    </ChatContextProvider>
  )
}

export default Chat
