import { PropsWithChildren } from 'react'

import ExploreList from '@/components/explore-list'
import NavSidebar from '@/components/nav-sidebar'

import ResponsiveLayout from '../../../components/layouts/responsive-layout'

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
