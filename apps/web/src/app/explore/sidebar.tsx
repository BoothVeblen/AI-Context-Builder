import { UserButton } from '@clerk/nextjs'

import { currentUser } from '@/lib/auth'
import { SidebarNav } from '@/components/ui/sidebar-nav'
import LoginLink from '@/components/login-link'

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
  const {
    id: userId,
    emailAddresses,
    firstName,
    lastName,
  } = (await currentUser()) ?? {}
  const name = `${firstName} ${lastName}`
  const email = emailAddresses?.[0].emailAddress

  return (
    <>
      <h1 className="px-6 py-4 text-2xl font-semibold">Explore</h1>
      <div className="m-full h-px bg-slate-100" />
      <div className="flex-1 overflow-y-auto px-1 py-3">
        <SidebarNav items={sidebarNavItems} />
      </div>
      <div className="flex h-16 items-center bg-slate-100">
        {userId ? (
          <div className="flex items-center space-x-2 px-4">
            <UserButton />
            <div>
              <p className="text-sm font-medium">{name}</p>
              <p className="text-xs font-medium text-slate-500">{email}</p>
            </div>
          </div>
        ) : (
          <LoginLink />
        )}
      </div>
    </>
  )
}
