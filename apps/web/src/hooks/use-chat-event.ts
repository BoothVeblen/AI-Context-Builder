import { useCallback, useEffect, useId, useRef } from 'react'
import useSWR from 'swr'

import { EventMessage } from '@/components/chat/types'

interface UseChatEventOptions {
  id?: string
  initialEvents?: EventMessage[]
}

export function useChatEvent({
  id,
  initialEvents = [],
}: UseChatEventOptions = {}) {
  const hookId = useId()
  const chatId = id || hookId

  const { data, mutate } = useSWR<EventMessage[]>([chatId], null, {
    fallbackData: initialEvents,
  })

  const messages = data!
  const messagesRef = useRef<EventMessage[]>(messages)
  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  const setMessages = useCallback(
    (
      messagesFunc:
        | EventMessage[]
        | ((messages: EventMessage[]) => EventMessage[])
    ) => {
      let newMessages
      if (typeof messagesFunc === 'function') {
        newMessages = messagesFunc(messagesRef.current)
      } else {
        newMessages = messagesFunc
      }
      mutate(newMessages, false)
      messagesRef.current = newMessages
    },
    [mutate]
  )

  return {
    eventMessages: messages,
    setEventMessages: setMessages,
  }
}
