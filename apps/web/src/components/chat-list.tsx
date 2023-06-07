import ChatListItem from './chat-list-item'

const CHAT_LIST_DATA = [
  {
    token: 'c1',
    title: 'Chat 1',
  },
  {
    token: 'c2',
    title: 'Chat 2',
  },
  {
    token: 'c3',
    title: 'Meeting Notes and Action Items',
  },
  {
    token: 'c4',
    title: 'Adding up Dollar Amounts in Excel',
  },
  {
    token: 'c5',
    title:
      'Unit Testing React Components with Vitest and @testing-library/react',
  },
]

interface IProps {
  botId: string
}

export default function ChatList({ botId }: IProps) {
  // TODO: use botId to fetch chat list data

  return (
    <nav className="flex flex-1 flex-col" aria-label="ChatList">
      <ul role="list" className="-mx-2 space-y-1">
        {CHAT_LIST_DATA.map(({ token, title }) => (
          <ChatListItem key={token} token={token} title={title} />
        ))}
      </ul>
    </nav>
  )
}
