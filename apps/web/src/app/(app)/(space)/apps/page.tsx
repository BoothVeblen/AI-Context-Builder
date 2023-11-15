import { Suspense } from 'react'

import AddAppButton from './add-app-button'
import CardList from './card-list'

export default function Page() {
  return (
    <div className="flex flex-col">
      {/* desktop version */}
      <div className="hidden h-12 items-center justify-between px-6 lg:flex">
        <h1 className="font-medium">My Apps</h1>
        <AddAppButton />
      </div>
      {/* mobile version */}
      <div className="fixed left-18 right-0 top-0 z-40 flex h-12 items-center text-sm font-medium leading-6 text-gray-900 lg:hidden">
        <h1 className="font-medium">My Apps</h1>
      </div>
      <div className="m-full hidden h-px shrink-0 bg-slate-200 lg:block" />
      <div className="p-6">
        <Suspense fallback={<CardList.Loading />}>
          <CardList />
        </Suspense>
      </div>
    </div>
  )
}
