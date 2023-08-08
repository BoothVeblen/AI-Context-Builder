import { PlusIcon } from 'lucide-react'

import { getApps } from '@/db/apps/actions'
import { Button } from '@/components/ui/button'
import AppCard from '@/components/app-card'
import CreateAppDialog from '@/components/create-app-dialog'
import MineList from '@/components/mine-list'
import RootWrapper from '@/components/root-wrapper'

export default async function Page() {
  const appList = await getApps()

  return (
    <RootWrapper pageTitle="My Space" nav={<MineList />}>
      <div className="flex flex-col">
        {/* desktop version */}
        <div className="hidden h-12 items-center justify-between px-6 lg:flex">
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
        {/* mobile version */}
        <div className="fixed left-10 right-0 top-0 z-40 flex h-12 items-center justify-between bg-white px-6 lg:hidden">
          <h1 className="font-medium">My Apps</h1>
        </div>
        <div className="m-full hidden h-px shrink-0 bg-slate-100 lg:block" />
        <div className="p-6">
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
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
    </RootWrapper>
  )
}
