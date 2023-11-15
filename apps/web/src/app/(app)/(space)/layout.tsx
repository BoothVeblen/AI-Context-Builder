import { PropsWithChildren } from 'react'

import ResponsiveLayout from '@/components/layouts/responsive-layout'
import MineList from '@/components/mine-list'
import NavSidebar from '@/components/nav-sidebar'

const Layout = ({ children }: PropsWithChildren) => {
  return (
    <ResponsiveLayout
      sidebar={
        <NavSidebar title="My Space">
          <MineList />
        </NavSidebar>
      }
    >
      {children}
    </ResponsiveLayout>
  )
}

export default Layout
