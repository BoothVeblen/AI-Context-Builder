import { redirect } from 'next/navigation'

export const runtime = 'edge'

interface IProps {
  params: { app_id: string }
}

export default function SettingsPage({ params }: IProps) {
  const { app_id } = params

  redirect(`/app/${app_id}/settings/basics`)
}
