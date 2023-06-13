interface IProps {
  params: { chat_id: string }
}

export default function ChatPage({ params }: IProps) {
  const { chat_id } = params
  // TODO: put <Chat id={chat_id} /> component into this page
  // and use chat_id to fetch chat data
  return <div>Chat: {chat_id}</div>
}
