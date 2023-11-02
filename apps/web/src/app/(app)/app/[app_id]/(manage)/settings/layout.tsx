import { redirect } from 'next/navigation'

import { getApp } from '@/db/apps/actions'
import { getLatestSessionId } from '@/db/sessions/actions'
import { checkIsAdminNotOwner, checkIsAdminOrOwner } from '@/utils/permission'
import ManageLayout from '@/components/layouts/manage-layout'
import WarningLabel from '@/components/warning-label'

import Sidebar from './sidebar'

export const runtime = 'edge'

interface IProps {
  children: React.ReactNode
  params: { app_id: string }
}

export default async function Layout({ children, params }: IProps) {
  const { app_id } = params

  const [appDetail, session_id] = await Promise.all([
    getApp(app_id),
    getLatestSessionId(app_id),
  ])
  const [isAdminOrOwner, isAdminNotOwner] = await Promise.all([
    checkIsAdminOrOwner(appDetail.created_by),
    checkIsAdminNotOwner(appDetail.created_by),
  ])

  if (!isAdminOrOwner) {
    redirect('/')
  }

  return (
    <>
      <ManageLayout
        sidebar={
          <Sidebar
            appId={app_id}
            appName={appDetail.name}
            sessionId={session_id || ''}
          />
        }
      >
        {children}
      </ManageLayout>
      {isAdminNotOwner && (
        <div className="fixed bottom-2 left-2 z-50">
          <WarningLabel>You are not the owner of this app.</WarningLabel>
        </div>
      )}
    </>
  )
}
