import { getApp } from '@/db/apps/actions'

import BasicsSettingForm from './form'

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
  }

  return (
    <div className="mx-14 mt-18 w-[530px]">
      <BasicsSettingForm appId={app_id} defaultValues={defaultValues} />
    </div>
  )
}
