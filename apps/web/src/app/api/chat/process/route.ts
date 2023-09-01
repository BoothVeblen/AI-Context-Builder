import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

// just for mock
// const PROCESS_DATA = [
//   {
//     key: 'tool-0',
//     finished: true,
//     succeed: true,
//   },
//   {
//     key: 'tool-1',
//     finished: true,
//     succeed: false,
//   },
//   {
//     id: 'tool-2',
//     finished: false,
//     success: false,
//   },
// ]

// Get chat process
export async function GET(req: NextRequest) {
  try {
    const query = req.nextUrl.searchParams
    const api_session_id = query.get('api_session_id') || ''

    // TODO: get the real data from api service
    // await new Promise((resolve) => setTimeout(resolve, 1000))
    // return NextResponse.json({ success: true, data: PROCESS_DATA })

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
