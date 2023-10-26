import { NextRequest, NextResponse } from 'next/server'

import { getDatasetDocument, getDataSplitPreview } from '@/db/documents/action'
import { NewDocument } from '@/db/documents/schema'
import { getSegments } from '@/db/documents/segment/actions'

import { createDocumentParams } from '../utils'

export const maxDuration = 300

// get document split preview
export async function POST(req: NextRequest) {
  const { dataset_id, dataConfig, preview, uid: _uid } = await req.json()
  const { files } = await createDocumentParams(dataConfig)
  if (_uid) {
    files[0].uid = _uid
  }
  const uid = files[0].uid
  await getDataSplitPreview(dataset_id, files, uid, preview)
  const data = await getSegments(dataset_id, uid)
  const segments =
    data?.segments?.length === 0
      ? [{ content: '', segment_id: '00' }]
      : data?.segments
  return NextResponse.json({
    success: true,
    data: { totalItems: data?.totalItems, segments },
  })
}

// get disabled noted data
export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams
  const dataset_id = query.get('dataset_id') || ''
  const documents = await getDatasetDocument(dataset_id)
  const data = documents?.filter(
    (item: NewDocument) => item?.type === 'annotated_data'
  )
  return NextResponse.json({
    data,
    success: true,
  })
}
