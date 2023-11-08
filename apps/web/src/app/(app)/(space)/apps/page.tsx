import { Suspense } from 'react'

import AddAppButton from './add-app-button'
import CardList, { CardListFallback } from './card-list'

export const runtime = 'edge'

export default function Page() {
  return (
    <div className="flex flex-col">
      {/* desktop version */}
      <div className="hidden h-12 items-center justify-between px-6 lg:flex">
        <h1 className="font-medium">My Apps</h1>
        <AddAppButton />
      </div>
      {/* mobile version */}
      <div className="m-full hidden h-px shrink-0 bg-slate-200 lg:block" />
      <div className="p-6">
        <Suspense fallback={<CardListFallback />}>
          <CardList />
        </Suspense>
      </div>
    </div>
  )
}
