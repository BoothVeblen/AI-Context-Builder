import { getDatasets } from '@/db/datasets/actions'
import { Skeleton } from '@/components/ui/skeleton'
import DatasetCard from '@/components/dataset-card'

export default async function CardList() {
  const datasets = await getDatasets()

  return (
    <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 ">
      {datasets?.map(({ short_id, name, config, linked_app_count }) => {
        const { files = [], loaderType } = config as any
        return (
          <DatasetCard
            key={short_id}
            id={short_id}
            title={name}
            iconType={loaderType}
            fileNum={files.length}
            linkedAppCount={linked_app_count as number}
          />
        )
      })}
    </ul>
  )
}

export function CardListFallback() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 ">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-[148px] rounded-lg border border-transparent"
        />
      ))}
    </div>
  )
}
