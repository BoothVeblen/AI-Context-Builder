import { redirect } from 'next/navigation'
import { and, eq } from 'drizzle-orm'

import { db } from '@/lib/drizzle-edge'

import { DatasetsTable } from '../datasets/schema'
import { AppsDatasetsTable } from './schema'

export async function getLinkedDatasetsByAppId(appId: string) {
  try {
    const items = await db
      .select()
      .from(AppsDatasetsTable)
      .rightJoin(
        DatasetsTable,
        and(
          eq(DatasetsTable.short_id, AppsDatasetsTable.dataset_id),
          eq(DatasetsTable.archived, false)
        )
      )
      .where(eq(AppsDatasetsTable.app_id, appId))

    const datasets = items.map((item) => item.datasets)

    return datasets
  } catch (error) {
    redirect('/')
  }
}
