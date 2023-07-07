'use client'

import { useParams } from 'next/navigation'

import DatasetSetting from '../../settings/setting-page'

const DatasetEdit = () => {
  const { dataset_id: datasetId } = useParams()
  console.log(datasetId, '--datasetId')
  // TODO: get defaultValue by datasetId
  // const defaultValue =
  return <DatasetSetting />
}
export default DatasetEdit
