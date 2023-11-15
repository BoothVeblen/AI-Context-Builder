import { getApps } from '@/db/apps/actions'
import { Skeleton } from '@/components/ui/skeleton'
import AppCard from '@/components/app-card'

import CardLayout from '../card-layout'

export default async function CardList() {
  const list = await getApps()

  return (
    <CardLayout>
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
    </CardLayout>
  )
}

function Loading() {
  return (
    <CardLayout>
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-[278px] rounded-lg border border-transparent"
        />
      ))}
    </CardLayout>
  )
}

CardList.Loading = Loading
