import { getAppsBasedOnIds } from '@/db/apps/actions'
import AppCard from '@/components/app-card'
import ExploreList from '@/components/explore-list'
import RootWrapper from '@/components/root-wrapper'

export default async function Page() {
  const list = await getAppsBasedOnIds([
    'R7cTLNuANTiD', // 'Product Customer Service',
    'JS0VUKV07Jat', // 'Multilingual Translation Assistant',
    'iBidZhqJSsBX', // 'Roleplay - Interviewer',
  ])

  return (
    <RootWrapper pageTitle="Explore" nav={<ExploreList />}>
      <div className="flex flex-col">
        <h1 className="hidden border-b border-slate-200 px-6 py-3 font-medium lg:block">
          Explore
        </h1>
        <div className="p-6">
          <h2 className="text-sm font-medium">All Categories</h2>
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
