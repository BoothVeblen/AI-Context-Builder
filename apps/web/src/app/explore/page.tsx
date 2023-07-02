import SidebarLayout from '@/components/sidebar-layout'

import ExploreSidebar from './sidebar'

export default async function ExplorePage() {
  return (
    <SidebarLayout sidebar={<ExploreSidebar />}>
      <div className="p-2">TODO</div>
    </SidebarLayout>
  )
}
