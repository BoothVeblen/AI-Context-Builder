import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'

import { db } from '@/lib/drizzle-edge'
import { AppsTable } from '@/db/apps/schema'
import { DatasetsTable } from '@/db/datasets/schema'
import { SessionsTable } from '@/db/sessions/schema'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  let appId = searchParams.get('app') || ''
  const sessionId = searchParams.get('session') || ''
  const dataset_id = searchParams.get('dataset') || ''

  if (appId === '' && sessionId === '' && dataset_id === '') {
    return NextResponse.json({ success: true })
  }

  let data = {} as any

  if (sessionId) {
    const [item] = await db
      .select()
      .from(SessionsTable)
      .where(eq(SessionsTable.short_id, sessionId))
    const { api_session_id, app_id, name, short_id } = item
    const session = {
      id: short_id,
      name,
      app_id,
      api_session_id,
    }
    data.session = session
    if (!appId) appId = app_id
  }

  if (appId) {
    const [item] = await db
      .select()
      .from(AppsTable)
      .where(eq(AppsTable.short_id, appId))
    const { api_model_id, name, short_id } = item
    const app = {
      id: short_id,
      name,
      api_model_id,
    }
    data.app = app
  }

  if (dataset_id) {
    const [item] = await db
      .select()
      .from(DatasetsTable)
      .where(eq(DatasetsTable.short_id, dataset_id))
    const { api_dataset_id, name, short_id } = item
    const dataset = {
      id: short_id,
      name,
      api_dataset_id,
    }
    data.dataset = dataset
  }

  return NextResponse.json({ success: true, data })
}
