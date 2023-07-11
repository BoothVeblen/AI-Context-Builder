import { getWorkspace } from '@/db/workspace/actions'

import NavSidebar from './nav-sidebar'
import WorkspaceSidebar from './workspace-sidebar'

export default async function RootSidebar() {
  const appList = await getWorkspace()

  return (
    <div className="flex h-full overflow-hidden lg:border-r lg:border-slate-100">
      <WorkspaceSidebar appList={appList} />
      <NavSidebar />
    </div>
  )
}
