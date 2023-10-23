import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { eq } from 'drizzle-orm'

import { db } from '@/lib/drizzle-edge'
import { safeParse } from '@/lib/utils'
import { AppsTable } from '@/db/apps/schema'
import { WorkflowItem } from '@/app/(app)/app/[app_id]/(manage)/settings/workflow/type'
import { taskToApiFormatter } from '@/app/(app)/app/[app_id]/(manage)/settings/workflow/utils'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const secret = searchParams.get('secret')
  if (secret == null || secret !== process.env.SECRET) {
    return NextResponse.json({ success: true })
  }

  const apps = await db.select().from(AppsTable)

  const newApps = []
  for (const app of apps) {
    const {
      short_id,
      api_model_id,
      workflow_data_str,
      published_workflow_data_str,
    } = app

    const new_workflow_data = safeParse(workflow_data_str, []).map(
      (task: WorkflowItem, idx: number) => ({
        ...task,
        key: idx,
      })
    )

    const new_published_workflow_data = safeParse(
      published_workflow_data_str,
      []
    ).map((task: WorkflowItem, idx: number) => ({
      ...task,
      key: idx,
    }))

    const chains = new_published_workflow_data.map(taskToApiFormatter)

    await axios.patch(
      `${process.env.AI_SERVICE_API_BASE_URL}/v1/models/${api_model_id}`,
      { chains }
    )

    const newValue = {
      workflow_data_str: JSON.stringify(new_workflow_data),
      published_workflow_data_str: JSON.stringify(new_published_workflow_data),
    }

    newApps.push({ short_id, newValue, chains })

    await db
      .update(AppsTable)
      .set(newValue)
      .where(eq(AppsTable.short_id, short_id))
  }

  const data = {
    apps,
    newApps,
  }

  return NextResponse.json({ success: true, data })
}
