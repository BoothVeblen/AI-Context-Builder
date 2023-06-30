import { getSession } from '@/db/sessions/actions'
import Chat from '@/components/chat/page'

interface IProps {
  params: { session_id: string }
}

export default async function SessionPage({ params }: IProps) {
  const { session_id } = params
  const sessionDetail = await getSession(session_id)

  return (
    <div className="h-full w-full overflow-hidden">
      <Chat sessionId={session_id} name={sessionDetail.name} />
    </div>
  )
}
