import { NextRequest, NextResponse } from 'next/server'

import { getMonitoringData } from '@/db/sessions/actions'

export async function GET(
  req: NextRequest,
  { params }: { params: { app_id: string } }
) {
  const app_id = params.app_id
  const query = req.nextUrl.searchParams
  const pageSize = parseInt(query.get('pageSize') || '')
  const page = parseInt(query.get('pageIndex') || '')
  const timeframe = query.get('timeframe') || ''
  const feedback = query.get('feedback') || ''
  const search = query.get('search') || ''
  if (isNaN(pageSize) || isNaN(page)) {
    return new Response('Bad Request', { status: 400 })
  }

  const ret = await getMonitoringData({
    appId: app_id,
    pageSize,
    page,
    timeframe,
    feedback,
    search,
  })

  return NextResponse.json({ success: true, data: ret })
}
