import { getApp } from '@/db/apps/actions'

import BasicsSettingForm from './form'

export const runtime = 'edge'

interface IProps {
  params: {
    app_id: string
  }
}

export default async function Page({ params }: IProps) {
  const { app_id } = params

  const appDetail = await getApp(app_id)

  const defaultValues = {
    name: appDetail?.name,
    description: appDetail?.description,
    icon: appDetail?.icon,
    opening_remarks: appDetail?.opening_remarks || '',
    enable_video_interaction: appDetail?.enable_video_interaction || false,
  }

  return (
    <div className="mx-10 mb-10 mt-18 w-[530px] px-4">
      <BasicsSettingForm appId={app_id} defaultValues={defaultValues} />
    </div>
  )
}
