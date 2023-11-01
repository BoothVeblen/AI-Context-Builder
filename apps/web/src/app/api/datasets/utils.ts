import { pick } from 'lodash'

import { getDatasetDocument } from '@/db/documents/action'
import { NewDocument } from '@/db/documents/schema'
import { FileProps } from '@/components/upload/utils'
import { DocumentParamsType, FileSplitConfigProps } from '@/app/dataset/type'

export async function formateDocumentParams(
  dataset_id: string,
  document_id?: string
) {
  const documents = await getDatasetDocument(dataset_id)
  // delete or add  document
  let currentFiles = documents?.filter(
    (item) => item?.short_id !== document_id
  ) as any[]

  const files = currentFiles?.reduce(
    (m: DocumentParamsType[], item: NewDocument) => {
      const current = item?.config as { splitConfig: FileSplitConfigProps }
      const config = current?.splitConfig

      const splitConfig = {
        split_type: config?.splitType,
        chunk_size: config?.chunkSize,
        chunk_overlap: config?.chunkOverlap,
      }
      const cur = {
        url: item?.url || '',
        type: item?.type,
        uid: item?.uid,
      }
      m.push({ ...cur, split_option: splitConfig })
      return m
    },
    []
  )
  return files
}

export async function createDocumentParams(dataConfig: any) {
  // edit or preview document segment
  const isNotedData = dataConfig?.loaderType === 'annotated_data'

  const splitConfig = {
    split_type: dataConfig?.splitType || 'character',
    chunk_size: dataConfig?.chunkSize || 500,
    chunk_overlap: dataConfig?.chunkOverlap || 0,
  }
  const currentDocuments = isNotedData
    ? dataConfig?.notedData
    : dataConfig?.files?.filter(
        (item: FileProps) => item?.type === dataConfig?.loaderType
      )

  const files = currentDocuments?.reduce(
    (m: DocumentParamsType[], item: FileProps) => {
      const cur = {
        url: item?.url || '',
        type: item?.type,
        uid: item?.uid,
        split_option: splitConfig,
      } as DocumentParamsType
      m.push(cur)
      return m
    },
    []
  )
  const config = pick(dataConfig, ['splitType', 'chunkSize', 'chunkOverlap'])
  return { files, splitConfig, config, currentDocuments }
}
