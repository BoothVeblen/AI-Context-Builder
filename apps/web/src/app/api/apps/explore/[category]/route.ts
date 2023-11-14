import { NextRequest, NextResponse } from 'next/server'

import { getAppsBasedOnIds } from '@/db/apps/actions'
import { getFeaturedAppIds } from '@/utils/explore'

// Get app list based on ids
export async function GET(
  req: NextRequest,
  { params }: { params: { category: string } }
) {
  const { category } = params
  const ids = getFeaturedAppIds(category)
  const list = await getAppsBasedOnIds(ids)
  return NextResponse.json({ success: true, data: list })
}
