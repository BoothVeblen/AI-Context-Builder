import 'server-only'

import { revalidateTag, unstable_cache } from 'next/cache'
import axios from 'axios'
import { and, desc, eq } from 'drizzle-orm'
import { isEqual, omit } from 'lodash'

import { auth } from '@/lib/auth'
import { db } from '@/lib/drizzle'
import { nanoid } from '@/lib/utils'
import { FileProps } from '@/components/upload/utils'

import { DatasetsTable, NewDataset } from './schema'

export async function addDataset(
  dataset: Omit<NewDataset, 'short_id' | 'created_by'>
) {
  const { userId } = auth()
  if (!userId) return null
  const { name } = dataset

  const { data: res } = await axios.post(
    'http://api.withcontext.ai/v1/datasets',
    {
      name,
    }
  )
  if (!res) return null
  const api_dataset_id = res?.data?.id
  const config = omit(dataset, 'name')
  const data = {
    name,
    short_id: nanoid(),
    created_by: userId,
    api_dataset_id,
    config,
  }
  const newDataset = await db.insert(DatasetsTable).values(data).returning()
  await revalidateTag(`/user/${userId}/datasets`)
  const datasetId = newDataset[0]?.short_id
  return { datasetId, name: newDataset[0].name }
}

export async function getDatasets() {
  const { userId } = auth()

  return await unstable_cache(
    async () => {
      if (!userId) return Promise.resolve([])
      return db
        .select()
        .from(DatasetsTable)
        .orderBy(desc(DatasetsTable.created_at))
        .where(
          and(
            eq(DatasetsTable.created_by, userId),
            eq(DatasetsTable.archived, false)
          )
        )
    },
    [`/user/${userId}/datasets`],
    {
      revalidate: 15 * 60,
      tags: [`/user/${userId}/datasets`],
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
    [`/dataset/${datasetId}`],
    {
      revalidate: 15 * 60,
      tags: [`/dataset/${datasetId}`],
    }
  )()
}

export async function editDataset(id: string, newValue: Partial<NewDataset>) {
  const { userId } = auth()
  if (!userId) return Promise.resolve([])
  const { name, config } = newValue
  const dataset = await getDataset(id)
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
      `http://api.withcontext.ai/v1/datasets/${api_dataset_id}`,
      editParams
    )
    if (res.status !== 200) return
  }
  const response = await db
    .update(DatasetsTable)
    .set({ name, config, updated_at: new Date() })
    .where(
      and(eq(DatasetsTable.short_id, id), eq(DatasetsTable.created_by, userId))
    )
  await revalidateTag(`/dataset/${id}`)
  await revalidateTag(`/user/${userId}/datasets`)
  return response
}

export async function removeDataset(dataset_id: string) {
  const { userId } = auth()
  if (!userId) return Promise.resolve([])

  const { api_dataset_id } = await getDataset(dataset_id)
  if (!api_dataset_id) return Promise.resolve([])

  const { data: res } = await axios.delete(
    `http://api.withcontext.ai/v1/datasets/${api_dataset_id}`
  )
  if (res?.status !== 200) return Promise.resolve([])

  const response = await db
    .update(DatasetsTable)
    .set({ archived: true, updated_at: new Date() })
    .where(
      and(
        eq(DatasetsTable.short_id, dataset_id),
        eq(DatasetsTable.created_by, userId)
      )
    )
  await revalidateTag(`/user/${userId}/datasets`)
  return response
}
