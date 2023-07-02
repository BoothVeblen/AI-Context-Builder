import { getSession } from '@/db/sessions/actions'
import Chat from '@/components/chat/page'

import AddAppToWorkspace from './add-app-to-workspace'

interface IProps {
  params: { app_id: string; session_id: string }
}

export default async function SessionPage({ params }: IProps) {
  const { app_id, session_id } = params
  const { sessions, apps } = await getSession(session_id)

  return (
    <>
      <div className="h-full w-full overflow-hidden">
        <Chat
          sessionId={session_id}
          sessionName={sessions.name}
          appId={apps?.short_id || ''}
          appName={apps?.name || ''}
          appIcon={apps?.icon || ''}
        />
      </div>
      <AddAppToWorkspace appId={app_id} />
    </>
  )
}
