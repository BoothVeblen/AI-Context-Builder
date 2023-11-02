'use client'

import BaseSideBar from '../sidebar'
import DeleteAppButton from './delete-app-button'

interface IProps {
  appId: string
  appName: string
  sessionId: string
}

export default function Sidebar({ appId, appName, sessionId }: IProps) {
  return (
    <BaseSideBar directUrl={`/app/${appId}/session/${sessionId}`}>
      <div className="pl-3 text-sm font-medium uppercase text-slate-500">
        App Settings
      </div>

      <BaseSideBar.Link
        href={{
          pathname: `/app/${appId}/settings/basics`,
        }}
        name="Basics"
        desc="Some basic configurations of the App."
      />
      <BaseSideBar.Link
        href={{
          pathname: `/app/${appId}/settings/workflow`,
        }}
        name="Workflow"
        desc="Workflow related configurations of the App."
      />

      <div className="mb-2 shrink-0 px-3">
        <div className="h-px bg-slate-200" />
      </div>

      <DeleteAppButton id={appId} name={appName} />
    </BaseSideBar>
  )
}
