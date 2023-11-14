import { getWorkspace } from '@/db/workspace/actions'
import { Skeleton } from '@/components/ui/skeleton'

import ClientComponent from './app-layout-sidebar-workspace.client'

export default async function WorkspaceList() {
  const list = await getWorkspace()
  return <ClientComponent appList={list} />
}

function Loading() {
  return (
    <ul role="list" className="flex flex-col space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="flex justify-center text-white">
          <Skeleton className="h-12 w-12 shrink-0 rounded-3xl" />
        </div>
      ))}
    </ul>
  )
}

WorkspaceList.Loading = Loading
