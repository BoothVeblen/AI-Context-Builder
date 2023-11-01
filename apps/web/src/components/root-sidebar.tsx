import { getWorkspace } from '@/db/workspace/actions'

import WorkspaceSidebar from './workspace-sidebar'

interface IProps {
  title?: string
  nav?: React.ReactNode
}

export default async function RootSidebar({ title, nav }: IProps) {
  const appList = await getWorkspace()

  return (
    <div className="flex h-full overflow-hidden lg:border-r lg:border-slate-200">
      <WorkspaceSidebar appList={appList} />
    </div>
  )
}
