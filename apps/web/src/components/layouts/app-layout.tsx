import { PropsWithChildren } from 'react'

import AppLayoutSidebar from '@/components/app-layout-sidebar'

const AppLayout = ({ children }: PropsWithChildren) => {
  return (
    <div className="flex h-full">
      <div className="hidden h-full lg:block">
        <AppLayoutSidebar />
      </div>
      <div className="flex-1">{children}</div>
    </div>
  )
}

export default AppLayout
