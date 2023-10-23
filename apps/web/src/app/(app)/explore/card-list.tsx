import { getAppsBasedOnIds } from '@/db/apps/actions'
import { Skeleton } from '@/components/ui/skeleton'
import AppCard from '@/components/app-card'
import { getFeaturedAppIds } from '@/app/(app)/explore/utils'

interface IProps {
  categoryName: string
}

export default async function CardList({ categoryName }: IProps) {
  const ids = getFeaturedAppIds(categoryName)
  const list = await getAppsBasedOnIds(ids)

  return (
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
  )
}

export function CardListFallback() {
  return (
    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-[278px] rounded-lg border border-transparent"
        />
      ))}
    </div>
  )
}
