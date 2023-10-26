import { getNotedData } from '@/db/documents/action'

import SettingPage from '../[document_id]/setting-page'

export const runtime = 'edge'

const defaultValues = {
  loaderType: 'pdf',
  splitType: 'character',
  files: [],
  notedData: [],
  chunkSize: 500,
  chunkOverlap: 0,
}

interface IProps {
  params: { dataset_id: string }
}
const DatasetEdit = async ({ params }: IProps) => {
  const { dataset_id } = params
  const apps = await getNotedData()

  return (
    <div className="h-full overflow-auto">
      <div className="w-full">
        <SettingPage
          defaultValues={defaultValues}
          datasetId={dataset_id}
          documentId={'add'}
          apps={apps?.data || []}
        />
      </div>
    </div>
  )
}
export default DatasetEdit
