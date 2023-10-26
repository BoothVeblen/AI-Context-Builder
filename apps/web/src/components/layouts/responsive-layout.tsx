import { PropsWithChildren } from 'react'

import WorkspaceSidebar from '@/components/workspace-sidebar'

import NavSheet from './nav-sheet'

type Props = {
  sidebar: React.ReactNode
  pageTitle?: string
  mainClassnames?: string
}

const ResponsiveLayout = (props: PropsWithChildren<Props>) => {
  const { sidebar, children, pageTitle } = props
  return (
    <div className="flex h-full flex-col lg:flex-row">
      {/* Static sidebar for desktop */}
      <div className="hidden h-full lg:block lg:border-r lg:border-slate-200">
        {sidebar}
      </div>

      {/* Float sidebar for mobile */}
      <NavSheet defaultPageTitle={pageTitle}>
        <WorkspaceSidebar />
        {sidebar}
      </NavSheet>

      {/* Page content for desktop and mobile */}
      <main className="h-full flex-1 overflow-auto pt-12 lg:pt-0">
        {children}
      </main>
    </div>
  )
}

export default ResponsiveLayout
