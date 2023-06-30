import { getApp } from '@/db/apps/actions'
import { getSessions } from '@/db/sessions/actions'
import AuthButton from '@/components/auth-button'
import SessionList from '@/components/session-list'
import SessionListHeader from '@/components/session-list-header'

import Header from './sidebar-header'
import Menu from './sidebar-menu'

export default async function AppSidebar({ appId }: { appId: string }) {
  const appDetail = await getApp(appId)
  const sessionList = await getSessions(appId)

  return (
    <>
      <div className="flex-1 overflow-y-auto">
        <Header
          appId={appId}
          name={appDetail.name}
          desc={appDetail.description}
          icon={appDetail.icon}
        />
        <div className="m-full h-px bg-slate-100" />
        <Menu />
        <div className="m-full h-px bg-slate-100" />
        <SessionListHeader appId={appId} />
        <SessionList appId={appId} sessionList={sessionList} />
        <div className="m-full h-px bg-slate-100" />
      </div>
      <AuthButton />
    </>
  )
}
