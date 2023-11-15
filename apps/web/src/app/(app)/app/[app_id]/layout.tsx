import ResponsiveLayout from '@/components/layouts/responsive-layout'

import Sidebar from './sidebar'

interface IProps {
  children: React.ReactNode
  params: { app_id: string; session_id: string }
}

export default async function Layout({ children, params }: IProps) {
  const { app_id } = params
  return (
    <ResponsiveLayout sidebar={<Sidebar appId={app_id} />}>
      {children}
    </ResponsiveLayout>
  )
}
