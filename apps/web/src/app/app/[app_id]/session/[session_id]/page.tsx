import { safeParse } from '@/lib/utils'
import { getSession } from '@/db/sessions/actions'
import Chat from '@/components/chat/page'
import { Message } from '@/components/chat/types'

import AddAppToWorkspace from './add-app-to-workspace'
import AppNotFound from './app-not-found'

export const runtime = 'edge'

interface IProps {
  params: { app_id: string; session_id: string }
}

export default async function SessionPage({ params }: IProps) {
  const { app_id, session_id } = params
  const { session, app, user } = await getSession(session_id, app_id)

  const messages = safeParse(session.messages_str, []).map(
    (message: Message) => ({
      ...message,
      type: 'chat',
    })
  )

  return (
    <>
      <div className="h-full w-full overflow-hidden">
        <Chat
          mode="live"
          app={app}
          session={session}
          user={user}
          initialMessages={messages}
          initialEvents={safeParse(session.events_str, [])}
        />
      </div>
      <AppNotFound archived={app?.archived || false} />
      <AddAppToWorkspace appId={app_id} />
    </>
  )
}
