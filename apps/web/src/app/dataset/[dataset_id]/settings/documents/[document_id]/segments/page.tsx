import { getDocumentDetail } from '@/db/documents/action'
import { NewDocument } from '@/db/documents/schema'

import SegmentPage from './view-page'

export const runtime = 'edge'

interface IProps {
  params: { dataset_id: string; document_id: string }
}

const Page = async ({ params }: IProps) => {
  const { dataset_id, document_id } = params
  const data = (await getDocumentDetail(document_id)) as NewDocument
  const { name, type, icon, app_id } = data
  return (
    <SegmentPage
      datasetId={dataset_id}
      name={name || ''}
      type={type || 'pdf'}
      icon={icon || ''}
      appId={app_id || ''}
    />
  )
}

export default Page
