import { nanoid } from '@/lib/utils'

import { Message, NewMessage } from './schema'

export function formatEventMessage(message: Partial<Message>): NewMessage {
  if (!message.session_id) {
    throw new Error('session_id is required')
  }
  return {
    short_id: message.short_id || nanoid(),
    session_id: message.session_id,
    type: 'event',
    event_type: message.event_type,
    created_at: new Date(message.created_at || Date.now()),
    ...(message.content && { content: message.content }),
    ...(message.call_duration && { call_duration: message.call_duration }),
  }
}
