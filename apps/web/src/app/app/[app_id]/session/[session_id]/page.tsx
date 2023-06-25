import Chat from '@/components/chat/page'

interface IProps {
  params: { session_id: string }
}

export default function SessionPage({ params }: IProps) {
  const { session_id } = params

  // TODO: put <Chat id={session_id} /> component into this page
  // and use session_id to fetch session data
  return (
    <div className="h-full w-full overflow-hidden">
      <Chat sessionId={session_id} />
    </div>
  )
}
