import { redirect } from 'next/navigation'

import { getApp } from '@/db/apps/actions'
import { getLatestSessionId, getSessions } from '@/db/sessions/actions'

// TODO: remove axios
// export const runtime = 'edge'

interface IProps {
  params: { app_id: string }
}

export default async function AppPage({ params }: IProps) {
  const { app_id } = params
  const session_id = await getLatestSessionId(app_id)
  redirect(`/app/${app_id}/session/${session_id}`)
}
