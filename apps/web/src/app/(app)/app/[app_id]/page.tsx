import { redirect } from 'next/navigation'

import { getLatestSessionId } from '@/db/sessions/actions'

interface IProps {
  params: { app_id: string }
}

export default async function AppPage({ params }: IProps) {
  const { app_id } = params
  const session_id = await getLatestSessionId(app_id)
  redirect(`/app/${app_id}/session/${session_id}`)
}
