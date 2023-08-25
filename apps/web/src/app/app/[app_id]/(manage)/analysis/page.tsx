import { redirect } from 'next/navigation'

interface IProps {
  params: { app_id: string }
}

export default function SettingsPage({ params }: IProps) {
  const { app_id } = params

  redirect(`/app/${app_id}/analysis/monitoring`)
}
