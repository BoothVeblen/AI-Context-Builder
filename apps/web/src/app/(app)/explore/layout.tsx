import { PropsWithChildren } from 'react'

import ExploreList from '@/components/explore-list'
import ResponsiveLayout from '@/components/layouts/responsive-layout'
import NavSidebar from '@/components/nav-sidebar'

const Layout = ({ children }: PropsWithChildren) => {
  return (
    <ResponsiveLayout
      pageTitle="Explore"
      sidebar={
        <NavSidebar title="Explore">
          <ExploreList />
        </NavSidebar>
      }
    >
      {children}
    </ResponsiveLayout>
  )
}

export default Layout
