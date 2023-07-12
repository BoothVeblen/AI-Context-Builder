import Link from 'next/link'
import { PlusIcon } from 'lucide-react'

import { getDatasets } from '@/db/datasets/actions'
import { Button } from '@/components/ui/button'
import DatasetCard from '@/components/dataset-card'
import RootWrapper from '@/components/root-wrapper'

export default async function Page() {
  const datasets = await getDatasets()
  return (
    <RootWrapper pageTitle="My Datasets">
      <div className="flex flex-col">
        <div className="hidden h-12 items-center justify-between px-6 lg:flex">
          <h1 className="font-medium">My Datasets</h1>
          <Link href="/dataset/new">
            <Button size="sm">
              <PlusIcon className="mr-2 h-4 w-4" />
              Add Dataset
            </Button>
          </Link>
        </div>
        <div className="m-full h-px bg-slate-100" />
        <div className="p-6">
          <ul className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {datasets?.map(({ short_id, name }) => (
              <DatasetCard key={short_id} id={short_id} title={name} />
            ))}
          </ul>
        </div>
      </div>
    </RootWrapper>
  )
}
