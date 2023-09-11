import { NextRequest, NextResponse } from 'next/server'
import { and, asc, desc, eq } from 'drizzle-orm'

import { createPool } from '@/lib/drizzle-pool'
import { MessagesTable } from '@/db/messages/schema'

export const runtime = 'edge'

// Get messages data of a session
export async function GET(
  req: NextRequest,
  { params }: { params: { session_id: string } }
) {
  const { session_id } = params
  const { pool, db } = createPool()

  const sq = db
    .select()
    .from(MessagesTable)
    .where(
      and(
        eq(MessagesTable.session_id, session_id),
        eq(MessagesTable.archived, false)
      )
    )
    .orderBy(desc(MessagesTable.created_at))
    .limit(100) // FIXME: pagination
    .as('sq')
  const data = await db.select().from(sq).orderBy(asc(sq.created_at))

  pool.end()

  return NextResponse.json({ success: true, data })
}
