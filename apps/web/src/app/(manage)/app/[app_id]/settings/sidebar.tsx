import { redirect } from 'next/navigation'

import { getApp } from '@/db/apps/actions'
import { getLatestSessionId } from '@/db/sessions/actions'
import { checkIsAdminNotOwner, checkIsAdminOrOwner } from '@/utils/permission'
import { Skeleton } from '@/components/ui/skeleton'
import WarningLabel from '@/components/warning-label'

import ClientSidebar from './sidebar.client'

interface IProps {
  appId: string
}

export default async function Sidebar({ appId }: IProps) {
  const [appDetail, session_id] = await Promise.all([
    getApp(appId),
    getLatestSessionId(appId),
  ])
  const [isAdminOrOwner, isAdminNotOwner] = await Promise.all([
    checkIsAdminOrOwner(appDetail.created_by),
    checkIsAdminNotOwner(appDetail.created_by),
  ])

  if (!isAdminOrOwner) {
    redirect('/')
  }
  return (
    <>
      <ClientSidebar
        appId={appId}
        appName={appDetail.name}
        sessionId={session_id || ''}
      />
      {isAdminNotOwner && (
        <div className="fixed bottom-2 left-2 z-50">
          <WarningLabel>You are not the owner of this app.</WarningLabel>
        </div>
      )}
    </>
  )
}

function Loading() {
  return (
    <div>
      <div className="flex items-center space-x-2 px-4 py-3">
        <Skeleton className="h-8 w-1/2" />
      </div>
      <div className="mt-4 space-y-2 p-2">
        <div className="px-2">
          <Skeleton className="h-5 w-1/2" />
        </div>
        <Skeleton className="h-[84px] w-full" />
        <Skeleton className="h-[84px] w-full" />
        <div className="mb-2 shrink-0 px-3">
          <div className="h-px bg-slate-200" />
        </div>
        <Skeleton className="h-9 w-full" />
      </div>
    </div>
  )
}

Sidebar.Loading = Loading
