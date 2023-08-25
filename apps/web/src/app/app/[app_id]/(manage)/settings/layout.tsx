import { redirect } from 'next/navigation'

import { auth } from '@/lib/auth'
import { getApp } from '@/db/apps/actions'

import Sidebar from './sidebar'

export const runtime = 'edge'

interface IProps {
  children: React.ReactNode
  params: { app_id: string }
}

export default async function SettingsLayout({ children, params }: IProps) {
  const { app_id } = params
  const { userId } = auth()

  const appDetail = await getApp(app_id)

  if (appDetail.created_by !== userId) {
    redirect('/')
  }

  return (
    <div className="fixed inset-0 z-50 flex h-full w-full bg-white">
      <div className="w-[276px] shrink-0 border-r border-slate-200 bg-slate-50">
        <Sidebar appId={app_id} appName={appDetail.name} />
      </div>
      <div className="flex-1">{children}</div>
    </div>
  )
}
