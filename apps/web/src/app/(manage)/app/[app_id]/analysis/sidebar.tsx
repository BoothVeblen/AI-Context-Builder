import { redirect } from 'next/navigation'

import { getApp } from '@/db/apps/actions'
import { checkIsAdminNotOwner, checkIsAdminOrOwner } from '@/utils/permission'
import { Skeleton } from '@/components/ui/skeleton'
import WarningLabel from '@/components/warning-label'

import ClientSidebar from './sidebar.client'

interface IProps {
  appId: string
}

export default async function Sidebar({ appId }: IProps) {
  const appDetail = await getApp(appId)

  const isAdminOrOwner = await checkIsAdminOrOwner(appDetail.created_by)
  if (!isAdminOrOwner) {
    redirect('/')
  }

  const isAdminNotOwner = await checkIsAdminNotOwner(appDetail.created_by)

  return (
    <>
      <ClientSidebar appId={appId} />
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
      </div>
    </div>
  )
}

Sidebar.Loading = Loading
