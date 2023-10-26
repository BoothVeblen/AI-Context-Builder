import { getDocumentDetail, getNotedData } from '@/db/documents/action'
import { NewDocument } from '@/db/documents/schema'
import { DataSchemeProps, FileSplitConfigProps } from '@/app/dataset/type'

import SettingPage from './setting-page'

export const runtime = 'edge'

interface IProps {
  params: { dataset_id: string; document_id: string }
}
export default async function Page({ params }: IProps) {
  const { dataset_id, document_id } = params
  const { data: apps = [] } = await getNotedData()

  const detail = (await getDocumentDetail(document_id)) as NewDocument
  const isNotedData = detail?.type === 'annotated_data'
  const config = detail?.config as { splitConfig: FileSplitConfigProps }
  const splitConfig = config?.splitConfig
  const defaultValues = {
    ...splitConfig,
    loaderType: detail?.type,
    files: isNotedData ? [] : [detail],
    notedData: isNotedData ? [detail] : [],
  } as DataSchemeProps

  return (
    <div className="h-full w-full overflow-auto">
      <SettingPage
        defaultValues={defaultValues}
        datasetId={dataset_id}
        documentId={document_id}
        apps={apps}
        uid={detail?.uid}
      />
    </div>
  )
}
