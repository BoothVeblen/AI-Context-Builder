import RootLayout from '@/components/root-layout'

import Sidebar from './sidebar'

interface IProps {
  children: React.ReactNode
  params: { app_id: string; session_id: string }
}

export default function Layout({ children, params }: IProps) {
  const { app_id } = params

  return (
    <RootLayout
      sidebar={<Sidebar appId={app_id} />}
      mainClassnames="h-[calc(100%-56px)] lg:pl-[312px] lg:h-full"
    >
      {children}
    </RootLayout>
  )
}
