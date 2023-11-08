import { auth } from '@/lib/auth'
import { getApp } from '@/db/apps/actions'

import MenuClient from './sidebar-menu.client'

interface IProps {
  appId: string
}

export default async function Menu({ appId }: IProps) {
  const { userId } = auth()
  const appDetail = await getApp(appId)
  const isOwner = userId === appDetail.created_by

  return <MenuClient appId={appId} isOwner={isOwner} appDetail={appDetail} />
}
