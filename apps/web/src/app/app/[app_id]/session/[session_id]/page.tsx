interface IProps {
  params: { session_id: string }
}

export default function SessionPage({ params }: IProps) {
  const { session_id } = params
  // TODO: put <Chat id={session_id} /> component into this page
  // and use session_id to fetch session data
  return <div>Session: {session_id}</div>
}
