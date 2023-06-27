import SidebarLayout from '@/components/sidebar-layout'

import AppSidebar from './sidebar'

interface IProps {
  children: React.ReactNode
  params: { app_id: string; session_id: string }
}

export default function AppLayout({ children, params }: IProps) {
  const { app_id } = params
  return (
    <SidebarLayout sidebar={<AppSidebar appId={app_id} />}>
      {children}
    </SidebarLayout>
  )
}
