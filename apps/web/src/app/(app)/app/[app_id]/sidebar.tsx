import { Suspense } from 'react'

import { Skeleton } from '@/components/ui/skeleton'
import AuthButton from '@/components/auth-button'
import SessionList from '@/components/session-list'
import SessionListHeader from '@/components/session-list-header'

import Header from './sidebar-header'
import Menu from './sidebar-menu'

export default async function Sidebar({ appId }: { appId: string }) {
  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex w-60 shrink-0 grow flex-col bg-gray-50">
        <div className="flex-1 overflow-y-auto scrollbar-none">
          <Suspense fallback={<Skeleton className="h-32 w-full" />}>
            <Header appId={appId} />
          </Suspense>
          <div className="m-full h-px bg-slate-200" />
          <Menu />
          <div className="m-full h-px bg-slate-200" />
          <SessionListHeader appId={appId} />
          <Suspense
            fallback={
              <div className="space-y-1 p-2">
                <Skeleton className="h-8 w-full bg-slate-200 p-2" />
              </div>
            }
          >
            <SessionList appId={appId} />
          </Suspense>
        </div>
        <AuthButton />
      </div>
    </div>
  )
}
