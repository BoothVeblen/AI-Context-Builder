import { NextRequest, NextResponse } from 'next/server'

import {
  addSegment,
  editSegment,
  getSegments,
} from '@/db/documents/segment/actions'

// get segments
export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams
  const dataset_id = query.get('dataset_id') || ''
  const uid = query.get('uid') || ''
  const limit = parseInt(query.get('pageSize') || '')
  const page = parseInt(query.get('pageIndex') || '')
  const search = query.get('search') || ''
  const offset = page * limit
  const data = await getSegments(dataset_id, uid, search, offset, limit)
  const segments =
    data?.segments?.length === 0
      ? [{ content: '', segment_id: '00' }]
      : data?.segments
  return NextResponse.json({
    success: true,
    data: { totalItems: data?.totalItems, segments },
  })
}

// add segment
export async function POST(req: NextRequest) {
  const { dataset_id, uid, content } = await req.json()
  const data = await addSegment(dataset_id, uid, content)
  return NextResponse.json({ success: true, data })
}

// edit segment
export async function PATCH(req: NextRequest) {
  const { dataset_id, uid, content, segment_id } = await req.json()
  const data = await editSegment(dataset_id, uid, segment_id, content)
  return NextResponse.json({ success: true, data })
}
