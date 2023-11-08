import { Suspense } from 'react'

import AddDatasetButton from './add-datasets-button'
import CardList, { CardListFallback } from './card-list'

export const runtime = 'edge'

export default function Page() {
  return (
    <div className="flex flex-col">
      {/* desktop version */}
      <div className="hidden h-12 items-center justify-between px-6 lg:flex">
        <h1 className="font-medium">My Datasets</h1>
        <AddDatasetButton />
      </div>
      {/* mobile version */}
      <div className="fixed left-10 right-0 top-0 z-40 flex h-12 items-center justify-between bg-white px-6 lg:hidden">
        <h1 className="font-medium">My Datasets</h1>
      </div>
      <div className="m-full hidden h-px shrink-0 bg-slate-200 lg:block" />
      <div className="p-6">
        <Suspense fallback={<CardListFallback />}>
          <CardList />
        </Suspense>
      </div>
    </div>
  )
}
