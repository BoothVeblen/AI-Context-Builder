import { Suspense } from 'react'
import { redirect } from 'next/navigation'

import ExploreList from '@/components/explore-list'
import RootWrapper from '@/components/root-wrapper'

import CardList, { CardListFallback } from '../card-list'
import { CATEGORY_IDS, getCategoryTitle } from '../utils'

interface IProps {
  params: {
    category_id: string
  }
}

export default function Page({ params }: IProps) {
  const { category_id } = params

  if (!CATEGORY_IDS.includes(category_id.toUpperCase())) {
    redirect(`/explore`)
  }

  return (
    <RootWrapper pageTitle="Explore" nav={<ExploreList />}>
      <div className="flex flex-col">
        <h1 className="hidden border-b border-slate-200 px-6 py-3 font-medium lg:block">
          Explore
        </h1>
        <div className="p-6">
          <h2 className="text-sm font-medium">
            {getCategoryTitle(category_id)}
          </h2>
          <Suspense fallback={<CardListFallback />}>
            <CardList categoryName={category_id} />
          </Suspense>
        </div>
      </div>
    </RootWrapper>
  )
}
