import { PlusIcon } from 'lucide-react'

import { getApps } from '@/db/apps/actions'
import { Button } from '@/components/ui/button'
import AppCard from '@/components/app-card'
import CreateAppDialog from '@/components/create-app-dialog'
import RootWrapper from '@/components/root-wrapper'

export default async function Page() {
  const appList = await getApps()

  return (
    <RootWrapper pageTitle="My Apps">
      <div className="flex flex-col">
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
        <div className="m-full h-px shrink-0 bg-slate-100" />
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
