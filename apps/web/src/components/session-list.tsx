import SessionListItem from './session-list-item'

const SESSION_LIST_DATA = [
  {
    token: 's1',
    title: 'Session 1',
  },
  {
    token: 's2',
    title: 'Session 2',
  },
  {
    token: 's3',
    title: 'Meeting Notes and Action Items',
  },
  {
    token: 's4',
    title: 'Adding up Dollar Amounts in Excel',
  },
  {
    token: 's5',
    title:
      'Unit Testing React Components with Vitest and @testing-library/react',
  },
]

interface IProps {
  appId: string
}

export default function SessionList({ appId }: IProps) {
  // TODO: use appId to fetch session list data

  return (
    <nav className="flex flex-1 flex-col" aria-label="SessionList">
      <ul role="list" className="-mx-2 space-y-1">
        {SESSION_LIST_DATA.map(({ token, title }) => (
          <SessionListItem key={token} token={token} title={title} />
        ))}
      </ul>
    </nav>
  )
}
