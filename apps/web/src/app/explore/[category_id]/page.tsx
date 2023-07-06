import HomeSidebar from '@/components/home-sidebar'
import SidebarLayout from '@/components/sidebar-layout'

interface IProps {
  params: {
    category_id: string
  }
}

export default async function Page({ params }: IProps) {
  const { category_id } = params

  return (
    <SidebarLayout sidebar={<HomeSidebar />}>
      <div className="p-2">TODO: explore {category_id}</div>
    </SidebarLayout>
  )
}
