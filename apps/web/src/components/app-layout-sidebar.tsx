import { Suspense } from 'react'

import NavList from './app-layout-sidebar-nav'
import WorkspaceList from './app-layout-sidebar-workspace'

export default function AppLayoutSidebar() {
  return (
    <div className="flex h-full w-18 shrink-0 flex-col overflow-y-auto bg-slate-900 scrollbar-none">
      <NavList />
      <div className="m-auto mt-6 h-px w-14 shrink-0 bg-slate-200" />
      <div className="flex-1 py-6">
        <Suspense fallback={<WorkspaceList.Loading />}>
          <WorkspaceList />
        </Suspense>
      </div>
    </div>
  )
}
