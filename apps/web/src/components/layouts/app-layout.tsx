import { PropsWithChildren } from 'react'

import { getWorkspace } from '@/db/workspace/actions'
import WorkspaceSidebar from '@/components/workspace-sidebar'

const AppLayout = async ({ children }: PropsWithChildren) => {
  const list = await getWorkspace()
  return (
    <div className="flex h-full">
      <div className="hidden h-full lg:block">
        <WorkspaceSidebar appList={list} />
      </div>
      <div className="flex-1">{children}</div>
    </div>
  )
}

export default AppLayout
