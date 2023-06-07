import SidebarLayout from '@/components/sidebar-layout'

import BotSidebar from './sidebar'

interface IProps {
  children: React.ReactNode
  params: { bot_id: string; chat_id: string }
}

export default function BotLayout({ children, params }: IProps) {
  const { bot_id } = params

  return (
    <SidebarLayout sidebar={<BotSidebar botId={bot_id} />}>
      {children}
    </SidebarLayout>
  )
}
