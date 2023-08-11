import { redirect } from 'next/navigation'

import { getAppsBasedOnIds } from '@/db/apps/actions'
import AppCard from '@/components/app-card'
import ExploreList from '@/components/explore-list'
import RootWrapper from '@/components/root-wrapper'

import { CATEGORY_IDS, getCategoryTitle, getFeaturedAppIds } from '../utils'

interface IProps {
  params: {
    category_id: string
  }
}

export default async function Page({ params }: IProps) {
  const { category_id } = params

  if (!CATEGORY_IDS.includes(category_id.toUpperCase())) {
    redirect(`/explore`)
  }

  const ids = getFeaturedAppIds(category_id)
  const list = await getAppsBasedOnIds(ids)

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
          <ul className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {list.map(({ short_id, name, description, icon }) => (
              <AppCard
                key={short_id}
                id={short_id}
                name={name}
                description={description}
                icon={icon}
                creator="@Context Builder"
              />
            ))}
          </ul>
        </div>
      </div>
    </RootWrapper>
  )
}
