import AuthButton from '@/components/auth-button'
import ChatList from '@/components/chat-list'

interface IProps {
  botId: string
}

export default async function BotSidebar({ botId }: IProps) {
  return (
    <>
      <h1 className="p-4 text-2xl font-semibold">Bot: {botId}</h1>
      <div className="m-full h-px bg-slate-100" />
      <div className="flex-1 overflow-y-auto p-4">
        <ChatList botId={botId} />
      </div>
      <AuthButton />
    </>
  )
}
