import { Suspense } from 'react'
import { PlusIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import CreateAppDialog from '@/components/create-app-dialog'
import MineList from '@/components/mine-list'
import RootWrapper from '@/components/root-wrapper'

import CardList, { CardListFallback } from './card-list'

export const runtime = 'edge'

export default function Page() {
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
        <div className="m-full hidden h-px shrink-0 bg-slate-200 lg:block" />
        <div className="p-6">
          <Suspense fallback={<CardListFallback />}>
            <CardList />
          </Suspense>
        </div>
      </div>
    </RootWrapper>
  )
}
