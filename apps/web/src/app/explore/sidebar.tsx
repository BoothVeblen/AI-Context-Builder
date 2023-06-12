import { SidebarNav } from '@/components/ui/sidebar-nav'
import AuthButton from '@/components/auth-button'

const sidebarNavItems = [
  {
    title: 'All Categories',
    href: '/',
  },
  {
    title: 'Human Resources',
    href: '/#',
  },
  {
    title: 'Translation',
    href: '/#',
  },
  {
    title: 'Knowledge Base',
    href: '/#',
  },
  {
    title: 'Self Training',
    href: '/#',
  },
]

export default async function ExploreSidebar() {
  return (
    <>
      <h1 className="px-6 py-4 text-2xl font-semibold">Explore</h1>
      <div className="m-full h-px bg-slate-100" />
      <div className="flex-1 overflow-y-auto px-1 py-3">
        <SidebarNav items={sidebarNavItems} />
      </div>
      <AuthButton />
    </>
  )
}
