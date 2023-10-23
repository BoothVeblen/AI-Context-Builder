import { getApps } from '@/db/apps/actions'
import { Skeleton } from '@/components/ui/skeleton'
import AppCard from '@/components/app-card'

export default async function CardList() {
  const list = await getApps()

  return (
    <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
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
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-[278px] rounded-lg border border-transparent"
        />
      ))}
    </div>
  )
}
