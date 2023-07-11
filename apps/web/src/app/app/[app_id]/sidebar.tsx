import { auth } from '@/lib/auth'
import { getApp } from '@/db/apps/actions'
import { getSessions } from '@/db/sessions/actions'
import { getWorkspace } from '@/db/workspace/actions'
import AuthButton from '@/components/auth-button'
import SessionList from '@/components/session-list'
import SessionListHeader from '@/components/session-list-header'
import WorkspaceSidebar from '@/components/workspace-sidebar'

import Header from './sidebar-header'
import Menu from './sidebar-menu'

export default async function Sidebar({ appId }: { appId: string }) {
  const { userId } = auth()
  const appList = await getWorkspace()
  const appDetail = await getApp(appId)
  const sessionList = await getSessions(appId)

  const isOwner = userId === appDetail.created_by

  return (
    <div className="flex h-full overflow-hidden lg:border-r lg:border-slate-100">
      <WorkspaceSidebar appList={appList} />
      <div className="flex w-60 shrink-0 grow flex-col bg-gray-50">
        <div className="flex-1 overflow-y-auto scrollbar-none">
          <Header
            appId={appId}
            name={appDetail.name}
            desc={appDetail.description}
            icon={appDetail.icon}
            isOwner={isOwner}
          />
          <div className="m-full h-px bg-slate-100" />
          <Menu />
          <div className="m-full h-px bg-slate-100" />
          <SessionListHeader appId={appId} />
          <SessionList appId={appId} sessionList={sessionList} />
          <div className="m-full h-px bg-slate-100" />
        </div>
        <AuthButton />
      </div>
    </div>
  )
}
