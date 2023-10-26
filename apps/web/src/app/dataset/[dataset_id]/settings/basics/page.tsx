import { redirect } from 'next/navigation'

import { auth } from '@/lib/auth'
import { getDataset } from '@/db/datasets/actions'

import BasicsForm from './basic-form'

export const runtime = 'edge'

interface IProps {
  params: { dataset_id: string }
}
const DatasetEdit = async ({ params }: IProps) => {
  const { dataset_id } = params
  const { userId } = auth()

  const datasetDetail = await getDataset(dataset_id)
  if (datasetDetail.created_by !== userId) {
    redirect('/')
  }
  const { config = {}, name = '' } = datasetDetail
  return (
    <div className="h-full overflow-auto">
      <div className="w-[600px]">
        <BasicsForm config={config || {}} datasetId={dataset_id} name={name} />
      </div>
    </div>
  )
}
export default DatasetEdit
