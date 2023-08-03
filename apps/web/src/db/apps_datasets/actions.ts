import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'

import { db } from '@/lib/drizzle'

import { DatasetsTable } from '../datasets/schema'
import { AppsDatasetsTable } from './schema'

export async function getLinkedDatasetsByAppId(appId: string) {
  try {
    const items = await db
      .select()
      .from(AppsDatasetsTable)
      .rightJoin(
        DatasetsTable,
        eq(DatasetsTable.short_id, AppsDatasetsTable.dataset_id)
      )
      .where(eq(AppsDatasetsTable.app_id, appId))

    const datasets = items.map((item) => item.datasets)

    return datasets
  } catch (error) {
    redirect('/')
  }
}
