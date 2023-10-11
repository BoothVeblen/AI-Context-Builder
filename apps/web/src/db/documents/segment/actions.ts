import { getDataset } from '../../datasets/actions'

export async function getApiDatasetId(dataset_id: string) {
  const dataset = await getDataset(dataset_id)
  const api_dataset_id = dataset?.api_dataset_id
  if (!api_dataset_id) return Promise.resolve([])
  return api_dataset_id
}

export async function getSegments(
  dataset_id: string,
  uid: string,
  search?: string,
  offset?: number,
  limit?: number
) {
  const api_dataset_id = await getApiDatasetId(dataset_id)
  let params = `offset=${offset || 0}&limit=${limit || 100}`
  if (search) {
    params = `query=${search}`
  }
  const data = await fetch(
    `${process.env.AI_SERVICE_API_BASE_URL}/v1/datasets/${api_dataset_id}/document/${uid}?${params}`,
    {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'GET',
    }
  ).then((res) => res.json())
  return data
}

export async function addSegment(
  dataset_id: string,
  uid: string,
  content: string
) {
  const api_dataset_id = await getApiDatasetId(dataset_id)
  const res = await fetch(
    `${process.env.AI_SERVICE_API_BASE_URL}/v1/datasets/${api_dataset_id}/document/${uid}/segment`,
    {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({ content }),
    }
  ).then((res) => res.json())

  return res
}

export async function editSegment(
  dataset_id: string,
  uid: string,
  segment_id: string,
  content: string
) {
  const api_dataset_id = await getApiDatasetId(dataset_id)
  const url = encodeURIComponent(segment_id)
  const data = await fetch(
    `${process.env.AI_SERVICE_API_BASE_URL}/v1/datasets/${api_dataset_id}/document/${uid}/segment/${url}`,
    {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify({ content }),
    }
  ).then((res) => res.json())

  return data
}
