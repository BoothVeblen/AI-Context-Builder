import { NextRequest, NextResponse } from 'next/server'

import { getDebugSessionId } from '@/db/apps/actions'
import { TreeItem } from '@/components/dnd/types'
import { WorkflowItem } from '@/app/(app)/app/[app_id]/(manage)/settings/workflow/type'

// Get an api_session_id
export async function POST(req: NextRequest) {
  try {
    const params = (await req.json()) as {
      tree: TreeItem[]
      data: WorkflowItem[]
    }
    const api_session_id = await getDebugSessionId(params)
    return NextResponse.json({ success: true, data: { api_session_id } })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message })
  }
}
