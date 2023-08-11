import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'

import { db } from '@/lib/drizzle'
import { safeParse } from '@/lib/utils'
import { Session, SessionsTable } from '@/db/sessions/schema'
import { EventMessage } from '@/components/chat/types'

async function getSession(session_id: string) {
  const [session] = await db
    .select()
    .from(SessionsTable)
    .where(eq(SessionsTable.short_id, session_id))
    .limit(1)

  return session
}

async function updateEvents(session: Session, newEvent: EventMessage) {
  const oldEvents = safeParse(session.events_str, [])
  const newEvents = [...oldEvents, newEvent]

  await db
    .update(SessionsTable)
    .set({
      events_str: JSON.stringify(newEvents),
    })
    .where(eq(SessionsTable.short_id, session.short_id))
}

export async function POST(req: NextRequest) {
  try {
    const { session_id, event } = (await req.json()) as {
      session_id: string
      event: EventMessage
    }
    const session = await getSession(session_id)
    if (!session) throw new Error('Session not found')
    await updateEvents(session, event)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message })
  }
}
