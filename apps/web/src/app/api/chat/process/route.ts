import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

// Get chat process
export async function GET(req: NextRequest) {
  try {
    const query = req.nextUrl.searchParams
    const api_session_id = query.get('api_session_id') || ''

    let res = await fetch(
      `${process.env.AI_SERVICE_API_BASE_URL}/v1/chat/session/${api_session_id}/process`
    )
    let data = await res.json()
    if (data.status !== 200) {
      throw new Error(`API service error: ${data.message}`)
    }

    return NextResponse.json({ success: true, data: data?.data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message })
  }
}
