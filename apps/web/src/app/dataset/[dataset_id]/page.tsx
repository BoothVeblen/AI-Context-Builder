import { redirect } from 'next/navigation'

import { auth } from '@/lib/auth'
import { getDataset } from '@/db/datasets/actions'

import DatasetSetting from './settings/setting-page'
import DatasetViewer from './viewer'

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

  return (
    <>
      {/* Desktop version, can edit */}
      <DatasetSetting
        name={datasetDetail?.name}
        config={datasetDetail?.config || {}}
        datasetId={dataset_id}
      />
      {/* Mobile version, view only */}
      <DatasetViewer
        name={datasetDetail?.name}
        config={datasetDetail?.config || {}}
      />
    </>
  )
}
export default DatasetEdit
