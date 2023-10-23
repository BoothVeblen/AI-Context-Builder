import { Suspense } from 'react'

import CardList, { CardListFallback } from './card-list'

export const runtime = 'edge'

export default function Page() {
  return (
    <div className="flex flex-col">
      <h1 className="hidden border-b border-slate-200 px-6 py-3 font-medium lg:block">
        Explore
      </h1>
      <div className="p-6">
        <h2 className="text-sm font-medium">All Categories</h2>
        <Suspense fallback={<CardListFallback />}>
          <CardList categoryName="all" />
        </Suspense>
      </div>
    </div>
  )
}
