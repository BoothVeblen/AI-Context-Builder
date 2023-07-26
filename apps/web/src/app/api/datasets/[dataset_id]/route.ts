import { NextRequest, NextResponse } from 'next/server'

import { addDataset, editDataset, removeDataset } from '@/db/datasets/actions'
import { NewDataset } from '@/db/datasets/schema'

// create a dataset
export async function POST(req: NextRequest) {
  const params = (await req.json()) as NewDataset
  const result = await addDataset(params)
  return NextResponse.json({ success: true, data: result })
}

// Get a dataset
export async function GET(
  req: NextRequest,
  { params }: { params: { dataset_id: string } }
) {
  const { dataset_id } = params
  return NextResponse.json({ success: true, data: { dataset_id } })
}

// // Update a dataset
export async function PATCH(
  req: NextRequest,
  { params }: { params: { dataset_id: string } }
) {
  const { dataset_id } = params

  const body = (await req.json()) as Partial<NewDataset>
  const response = (await editDataset(dataset_id, body)) as any
  if (response?.error) {
    return NextResponse.json({ success: false, error: response?.error })
  } else {
    return NextResponse.json({
      success: true,
      data: { dataset_id, body },
    })
  }
}

// // Delete a dataset
export async function DELETE(
  req: NextRequest,
  { params }: { params: { dataset_id: string } }
) {
  const { dataset_id } = params
  await removeDataset(dataset_id)
  return NextResponse.json({ success: true, data: { dataset_id } })
}
