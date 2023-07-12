import { getDataset } from '@/db/datasets/actions'

import DatasetSetting from './settings/setting-page'

interface IProps {
  params: { dataset_id: string }
}
const DatasetEdit = async ({ params }: IProps) => {
  const dataset_id = params?.dataset_id
  const data = await getDataset(dataset_id)
  return (
    <DatasetSetting
      name={data?.name}
      config={data?.config || {}}
      datasetId={dataset_id}
    />
  )
}
export default DatasetEdit
