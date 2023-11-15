'use client'

import { Skeleton } from '@/components/ui/skeleton'

import BaseSideBar from '../sidebar'

interface IProps {
  appId: string
}

export default function Sidebar({ appId }: IProps) {
  return (
    <BaseSideBar>
      <div className="pl-3 text-sm font-medium uppercase text-slate-500">
        App Analysis
      </div>

      <BaseSideBar.Link
        href={`/app/${appId}/analysis/monitoring`}
        name="Monitoring"
        desc="Monitoring application usage situation."
      />
    </BaseSideBar>
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
