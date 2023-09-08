import { Loader2Icon } from 'lucide-react'
import useSWR from 'swr'

import { fetcher } from '@/lib/utils'
import { getMessages } from '@/db/messages/actions'
import { getSession } from '@/db/sessions/actions'

import { ChatContextProvider, ChatMode } from './chat-context'
import ChatList from './chat-list'
import { Message } from './types'
import { messageFormatter, messagesBuilder } from './utils'

type SessionData = Awaited<ReturnType<typeof getSession>>
type MessagesData = Awaited<ReturnType<typeof getMessages>>

interface IProps {
  mode: ChatMode
  sessionId: string
}

export default function ChatListWithData({ mode, sessionId }: IProps) {
  const { data: sessionData, isLoading: isLoadingSessionData } =
    useSWR<SessionData>(`/api/sessions/${sessionId}`, fetcher)

  const { data: rawMessages, isLoading: isLoadingMessagesData } =
    useSWR<MessagesData>(`/api/sessions/${sessionId}/messages`, fetcher)

  const { session, app, user } = sessionData || {}
  const allMessages = messagesBuilder(rawMessages || [])
  const messages = allMessages
    .map(messageFormatter)
    .filter(Boolean) as Message[]
  const isLoading = isLoadingSessionData || isLoadingMessagesData

  return (
    <ChatContextProvider
      mode={mode}
      app={app}
      user={user}
      session={session!}
      isLoading={isLoading}
    >
      {isLoading ? (
        <div className="mt-32 flex justify-center">
          <Loader2Icon className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <ChatList messages={messages} />
      )}
    </ChatContextProvider>
  )
}
