import { PlusIcon } from 'lucide-react'

import { getDatasets } from '@/db/datasets/actions'
import DatasetCard from '@/components/dataset-card'
import RootWrapper from '@/components/root-wrapper'

import CreateDialog from './create-dataset'

export default async function Page() {
  const datasets = await getDatasets()
  return (
    <RootWrapper pageTitle="My Datasets">
      <div className="flex flex-col">
        {/* desktop version */}
        <div className="hidden h-12 items-center justify-between px-6 lg:flex">
          <h1 className="font-medium">My Datasets</h1>
          <CreateDialog />
        </div>
        {/* mobile version */}
        {/* <div className="fixed left-10 right-0 top-0 z-40 flex h-12 items-center justify-between bg-white px-6 lg:hidden">
          <h1 className="font-medium">My Datasets</h1>
          <CreateDialog />
        </div> */}
        <div className="m-full hidden h-px shrink-0 bg-slate-100 lg:block" />
        <div className="p-6">
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {datasets?.map(({ short_id, name }) => (
              <DatasetCard key={short_id} id={short_id} title={name} />
            ))}
          </ul>
        </div>
      </div>
    </RootWrapper>
  )
}
