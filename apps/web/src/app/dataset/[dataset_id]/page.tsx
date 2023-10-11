import { redirect } from 'next/navigation'

export const runtime = 'edge'

interface IProps {
  params: { dataset_id: string }
}

export default function SettingsPage({ params }: IProps) {
  const { dataset_id } = params

  redirect(`/dataset/${dataset_id}/settings/documents`)
}
