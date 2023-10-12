import { NextRequest, NextResponse } from 'next/server'

import { editDatasetDocument } from '@/db/datasets/actions'
import {
  addDocuments,
  deleteDocument,
  editDocument,
  getDocumentByTable,
} from '@/db/documents/action'
import { FileProps } from '@/components/upload/utils'

import { createDocumentParams, formateDocumentParams } from '../utils'

// // Delete a data
export async function DELETE(req: NextRequest) {
  const { dataset_id, uid: short_id } = await req.json()
  const deleted = await deleteDocument(dataset_id, short_id)

  const files = await formateDocumentParams(dataset_id, short_id)
  const response = (await editDatasetDocument(dataset_id, files)) as any
  return NextResponse.json({
    success: true,
    data: { dataset_id, short_id, response },
  })
}

// add data
export async function POST(req: NextRequest) {
  const { dataset_id, dataConfig } = await req.json()
  const isNotedData = dataConfig?.loaderType === 'annotated_data'

  const currents = isNotedData ? dataConfig?.notedData : dataConfig?.files
  const { files, config } = await createDocumentParams(dataConfig)
  const documents = await formateDocumentParams(dataset_id, '')

  const response = (await editDatasetDocument(dataset_id, [
    ...files,
    ...documents,
  ])) as any

  await addDocuments({
    documents: currents,
    dataset_id,
    type: dataConfig?.loaderType,
    config,
  })

  return NextResponse.json({
    success: true,
    data: { dataset_id, response },
  })
}

// edit data
export async function PATCH(req: NextRequest) {
  const { dataset_id, dataConfig, document_id, isSynchrony, uid } =
    await req.json()

  const documents = await formateDocumentParams(dataset_id, '')
  let data = documents
  if (!isSynchrony) {
    // edit document
    const { currentDocuments, config, files, splitConfig } =
      await createDocumentParams(dataConfig)
    const editRes = await editDocument(document_id, currentDocuments, config)
    files[0].uid = uid
    const index = documents?.findIndex((item: FileProps) => item?.uid === uid)
    data[index] = {
      uid,
      url: currentDocuments[0]?.url || '',
      type: currentDocuments[0]?.type,
      split_option: splitConfig,
    }
  }
  const response = (await editDatasetDocument(dataset_id, data)) as any

  return NextResponse.json({
    success: true,
    data: { dataset_id, response },
  })
}

// get document table
export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams
  const pageSize = parseInt(query.get('pageSize') || '')
  const pageIndex = parseInt(query.get('pageIndex') || '')
  const search = query.get('search') || ''
  const dataset_id = query.get('datasetId') || ''
  const data = await getDocumentByTable({
    dataset_id,
    params: { search, pageIndex, pageSize },
  })
  return NextResponse.json({
    success: true,
    data,
  })
}
