import { BASE_URL } from '@/lib/utils'
import { App } from '@/db/apps/schema'
import { Skeleton } from '@/components/ui/skeleton'
import AppCard from '@/components/app-card'

interface IProps {
  categoryName: string
}

export default async function CardList({ categoryName }: IProps) {
  const res = await fetch(`${BASE_URL}/api/public/explore/${categoryName}`, {
    next: {
      revalidate: 3600,
    },
  })
  const json = await res.json()
  const list = (json?.data || []) as App[]

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
