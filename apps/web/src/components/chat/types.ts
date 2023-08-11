import { App } from '@/db/apps/schema'
import { Session } from '@/db/sessions/schema'

export type ChatSession = Pick<Session, 'short_id' | 'api_session_id' | 'name'>

export type ChatApp = Pick<
  App,
  'short_id' | 'icon' | 'name' | 'opening_remarks' | 'enable_video_interaction'
>

export interface EventMessage {
  type: 'event'
  data: any
}
