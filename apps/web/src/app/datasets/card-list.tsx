import { getDatasets } from '@/db/datasets/actions'
import { getDocumentsCount } from '@/db/documents/action'
import { Skeleton } from '@/components/ui/skeleton'
import DatasetCard from '@/components/dataset-card'

export default async function CardList() {
  const datasets = await getDatasets()
  const documentCounts = await getDocumentsCount()
  return (
    <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 ">
      {datasets?.map(({ short_id, name, config, linked_app_count }) => {
        const cur = documentCounts?.find(
          (item) => item?.dataset_id === short_id
        )
        const { loaderType } = config as any
        return (
          <DatasetCard
            key={short_id}
            id={short_id}
            title={name}
            iconType={loaderType}
            fileNum={cur?.count || 0}
            totalWords={cur?.characters || 0}
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
