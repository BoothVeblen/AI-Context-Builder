import { redirect } from 'next/navigation'

interface IProps {
  params: { app_id: string }
}

export default function AppPage({ params }: IProps) {
  const { app_id } = params
  // TODO: use app_id to fetch the latest session id
  // if no session id found, create one

  redirect(`/app/${app_id}/session/s1`)
}
