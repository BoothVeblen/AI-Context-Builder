import { getDataset } from '@/db/datasets/actions'

import DatasetSetting from './settings/setting-page'
import DatasetViewer from './viewer'

interface IProps {
  params: { dataset_id: string }
}
const DatasetEdit = async ({ params }: IProps) => {
  const dataset_id = params?.dataset_id
  const data = await getDataset(dataset_id)
  return (
    <>
      {/* Desktop version, can edit */}
      <DatasetSetting
        name={data?.name}
        config={data?.config || {}}
        datasetId={dataset_id}
      />
      {/* Mobile version, view only */}
      <DatasetViewer name={data?.name} config={data?.config || {}} />
    </>
  )
}
export default DatasetEdit
