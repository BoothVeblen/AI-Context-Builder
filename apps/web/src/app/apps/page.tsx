import { PlusIcon } from 'lucide-react'

import { getApps } from '@/db/apps/actions'
import { Button } from '@/components/ui/button'
import AppCard from '@/components/app-card'
import CreateAppDialog from '@/components/create-app-dialog'
import HomeSidebar from '@/components/home-sidebar'
import SidebarLayout from '@/components/sidebar-layout'

const LIST = [
  {
    id: 'CbfWtV8',
    title: 'App 1, App 1, App 1, App 1, App 1',
    description:
      'App 1 Description, App 1 Description, App 1 Description, App 1 Description, App 1 Description, App 1 Description, App 1 Description, App 1 Description, App 1 Description, App 1 Description, App 1 Description, App 1 Description,',
    icon: '',
  },
  {
    id: 'Utxx7ga',
    title: 'App 2',
    description: 'App 2 Description',
    icon: '',
  },
  {
    id: 'GI6hAFE',
    title: 'App 3',
    description: 'App 3 Description',
    icon: '',
  },
  {
    id: 'WMZeCI3',
    title: 'App 4',
    description: 'App 4 Description',
    icon: '',
  },
  {
    id: 'gRBqVWJ',
    title: 'App 5',
    description: 'App 5 Description',
    icon: '',
  },
  {
    id: 'Zq2go3j',
    title: 'App 6',
    description: 'App 6 Description',
    icon: '',
  },
]

export default async function Page() {
  const appList = await getApps()

  return (
    <SidebarLayout sidebar={<HomeSidebar />}>
      <div className="flex flex-col">
        <div className="flex h-12 items-center justify-between px-6">
          <h1 className="font-medium">My Apps</h1>
          <CreateAppDialog
            dialogTrigger={
              <Button size="sm">
                <PlusIcon className="mr-2 h-4 w-4" />
                Create App
              </Button>
            }
          />
        </div>
        <div className="m-full h-px bg-slate-100" />
        <div className="p-6">
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {appList.map(({ short_id, name, description, icon }) => (
              <AppCard
                key={short_id}
                id={short_id}
                name={name}
                description={description}
                icon={icon}
              />
            ))}
          </ul>
        </div>
      </div>
    </SidebarLayout>
  )
}
