'use client'

import * as React from 'react'

import { initPusher } from '@/lib/pusher-client'

export default function Subscriber() {
  const [messages, setMessages] = React.useState<String[]>([])

  React.useEffect(() => {
    const pusher = initPusher()
    if (!pusher) return

    const channel = pusher.subscribe('my-channel')

    const callback = (data: any) => {
      const message = data.message as string
      setMessages((messages) => [...messages, message])
    }

    channel.bind('my-event', callback)

    return () => {
      if (channel) channel.unbind('my-event')
      if (pusher) pusher.unsubscribe('my-channel')
    }
  }, [])

  return (
    <div className="mt-4 space-y-2">
      {messages.map((message, index) => (
        <div key={index}>{message}</div>
      ))}
    </div>
  )
}
