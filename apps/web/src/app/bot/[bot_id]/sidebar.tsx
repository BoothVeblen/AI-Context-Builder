import { UserButton } from '@clerk/nextjs'

import { currentUser } from '@/lib/auth'
import ChatList from '@/components/chat-list'
import LoginLink from '@/components/login-link'

interface IProps {
  botId: string
}

export default async function BotSidebar({ botId }: IProps) {
  const {
    id: userId,
    emailAddresses,
    firstName,
    lastName,
  } = (await currentUser()) ?? {}
  const name = `${firstName} ${lastName}`
  const email = emailAddresses?.[0].emailAddress

  return (
    <>
      <h1 className="p-4 text-2xl font-semibold">Bot: {botId}</h1>
      <div className="m-full h-px bg-slate-100" />
      <div className="flex-1 overflow-y-auto p-4">
        <ChatList botId={botId} />
      </div>
      <div className="flex h-16 items-center bg-slate-100">
        {userId ? (
          <div className="flex items-center space-x-2 px-4">
            <UserButton />
            <div>
              <p className="text-sm font-medium">{name}</p>
              <p className="text-xs font-medium text-slate-500">{email}</p>
            </div>
          </div>
        ) : (
          <LoginLink />
        )}
      </div>
    </>
  )
}
