import 'server-only'

import { revalidateTag, unstable_cache } from 'next/cache'
import axios from 'axios'
import { and, desc, eq, sql } from 'drizzle-orm'
import { isEqual, omit } from 'lodash'

import { auth } from '@/lib/auth'
import { db } from '@/lib/drizzle'
import { flags } from '@/lib/flags'
import { nanoid } from '@/lib/utils'
import { FileProps } from '@/components/upload/utils'

import { AppsDatasetsTable } from '../apps_datasets/schema'
import { DatasetsTable, NewDataset } from './schema'

export async function addDataset(
  dataset: Omit<NewDataset, 'short_id' | 'created_by'>
) {
  const { userId } = auth()
  if (!userId) return null
  const { name } = dataset

  let api_dataset_id = ''
  if (flags.enabledAIService) {
    const { data: res } = await axios.post(
      `${process.env.AI_SERVICE_API_BASE_URL}/v1/datasets`,
      {
        name,
      }
    )
    if (!res) return null
    api_dataset_id = res?.data?.id
  }

  const config = omit(dataset, 'name')
  const data = {
    name,
    short_id: nanoid(),
    created_by: userId,
    api_dataset_id,
    config,
  }
  const newDataset = await db.insert(DatasetsTable).values(data).returning()
  await revalidateTag(`user:${userId}:datasets`)
  const datasetId = newDataset[0]?.short_id
  return { datasetId, name: newDataset[0].name }
}

export async function getDatasets() {
  const { userId } = auth()

  return await unstable_cache(
    async () => {
      if (!userId) return Promise.resolve([])
      return db
        .select({
          short_id: DatasetsTable.short_id,
          name: DatasetsTable.name,
          config: DatasetsTable.config,
          api_dataset_id: DatasetsTable.api_dataset_id,
          linked_app_count: sql`count(${AppsDatasetsTable.app_id})`,
        })
        .from(DatasetsTable)
        .orderBy(desc(DatasetsTable.created_at))
        .where(
          and(
            eq(DatasetsTable.created_by, userId),
            eq(DatasetsTable.archived, false)
          )
        )
        .leftJoin(
          AppsDatasetsTable,
          eq(AppsDatasetsTable.dataset_id, DatasetsTable.short_id)
        )
        .groupBy(DatasetsTable.id)
    },
    [`user:${userId}:datasets`],
    {
      revalidate: 15 * 60,
      tags: [`user:${userId}:datasets`],
    }
  )()
}

export async function getDataset(datasetId: string) {
  return await unstable_cache(
    async () => {
      const items = await db
        .select()
        .from(DatasetsTable)
        .where(eq(DatasetsTable.short_id, datasetId))
      return Promise.resolve(items[0])
    },
    [`dataset:${datasetId}`],
    {
      revalidate: 15 * 60,
      tags: [`dataset:${datasetId}`],
    }
  )()
}

export async function editDataset(
  datasetId: string,
  newValue: Partial<NewDataset>
) {
  const { userId } = auth()
  if (!userId) return Promise.resolve([])
  const { name, config } = newValue

  if (flags.enabledAIService) {
    const dataset = await getDataset(datasetId)
    const api_dataset_id = dataset?.api_dataset_id
    if (!api_dataset_id) return Promise.resolve([])

    const oldFiles = (dataset?.config as any)?.files
    const newFiles = (config as any)?.files
    const update = !isEqual(oldFiles, newFiles)
    if (update) {
      const documents = newFiles?.reduce(
        (m: Record<string, any>[], item: FileProps) => {
          const cur = omit(item, 'name')
          m.push(cur)
          return m
        },
        []
      )
      const editParams = { name, documents }
      let { data: res } = await axios.patch(
        `${process.env.AI_SERVICE_API_BASE_URL}/v1/datasets/${api_dataset_id}`,
        editParams
      )
      if (res.status !== 200) return
    }
  }

  const response = await db
    .update(DatasetsTable)
    .set({ name, config, updated_at: new Date() })
    .where(
      and(
        eq(DatasetsTable.short_id, datasetId),
        eq(DatasetsTable.created_by, userId)
      )
    )
  await revalidateTag(`dataset:${datasetId}`)
  await revalidateTag(`user:${userId}:datasets`)
  return response
}

export async function removeDataset(datasetId: string) {
  const { userId } = auth()
  if (!userId) return Promise.resolve([])

  if (flags.enabledAIService) {
    const { api_dataset_id } = await getDataset(datasetId)
    if (!api_dataset_id) return Promise.resolve([])

    const { data: res } = await axios.delete(
      `${process.env.AI_SERVICE_API_BASE_URL}/v1/datasets/${api_dataset_id}`
    )
    if (res?.status !== 200) return Promise.resolve([])
  }

  const response = await db
    .update(DatasetsTable)
    .set({ archived: true, updated_at: new Date() })
    .where(
      and(
        eq(DatasetsTable.short_id, datasetId),
        eq(DatasetsTable.created_by, userId)
      )
    )
  await revalidateTag(`user:${userId}:datasets`)
  return response
}
