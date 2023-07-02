import { getSession } from '@/db/sessions/actions'
import Chat from '@/components/chat/page'

import AddAppToWorkspace from './add-app-to-workspace'

interface IProps {
  params: { app_id: string; session_id: string }
}

export default async function SessionPage({ params }: IProps) {
  const { app_id, session_id } = params
  const sessionDetail = await getSession(session_id)

  return (
    <>
      <div className="h-full w-full overflow-hidden">
        <Chat sessionId={session_id} name={sessionDetail.name} />
      </div>
      <AddAppToWorkspace appId={app_id} />
    </>
  )
}
